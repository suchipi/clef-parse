import path from "path";
import { Path } from "nice-path";
import { convertToCamelCase } from "./convert-case";

export const arrayOfStrings = Symbol("arrayOfStrings");
export const arrayOfBooleans = Symbol("arrayOfBooleans");
export const arrayOfNumbers = Symbol("arrayOfNumbers");
export const arrayOfPaths = Symbol("arrayOfPaths");

export type Hint =
  | typeof String
  | typeof Boolean
  | typeof Number
  | typeof Path
  | typeof arrayOfStrings
  | typeof arrayOfBooleans
  | typeof arrayOfNumbers
  | typeof arrayOfPaths;

export { Path };

function bestGuess(nextValue: string | undefined): Hint {
  if (nextValue === "true" || nextValue === "false") {
    return Boolean;
  } else if (nextValue == null || nextValue.startsWith("-")) {
    return Boolean;
  } else if (nextValue === String(Number(nextValue))) {
    return Number;
  } else {
    return String;
  }
}

function hintToString(hint: Hint): string {
  switch (hint) {
    case arrayOfStrings: {
      return "array of strings";
    }
    case arrayOfBooleans: {
      return "array of booleans";
    }
    case arrayOfNumbers: {
      return "array of numbers";
    }
    case arrayOfPaths: {
      return "array of paths";
    }
    case String: {
      return "string";
    }
    case Boolean: {
      return "boolean";
    }
    case Number: {
      return "number";
    }
    case Path: {
      return "path";
    }
    default: {
      throw new Error("Invalid hint: " + hint);
    }
  }
}

function hintToArrayHint(hint: Hint): Hint {
  switch (hint) {
    case arrayOfStrings:
    case arrayOfBooleans:
    case arrayOfNumbers:
    case arrayOfPaths: {
      return hint;
    }
    case String: {
      return arrayOfStrings;
    }
    case Boolean: {
      return arrayOfBooleans;
    }
    case Number: {
      return arrayOfNumbers;
    }
    case Path: {
      return arrayOfPaths;
    }
    default: {
      throw new Error("Invalid hint: " + hint);
    }
  }
}

function countFlagUsages(argv: Array<string>): Record<string, number> {
  const propertyNamesAndDoubleDash = argv
    .filter((item) => item.startsWith("-"))
    .map((item) => {
      if (item === "--") {
        return "--";
      } else if (/=/.test(item)) {
        const equalsOffset = item.indexOf("=");
        const before = item.slice(0, equalsOffset);
        return convertToCamelCase(before);
      } else {
        return convertToCamelCase(item);
      }
    });

  let propertyNames: Array<string>;
  const indexOfDoubleDash = propertyNamesAndDoubleDash.indexOf("--");
  if (indexOfDoubleDash !== -1) {
    propertyNames = propertyNamesAndDoubleDash.slice(0, indexOfDoubleDash);
  } else {
    propertyNames = propertyNamesAndDoubleDash;
  }

  return propertyNames.reduce(
    (obj, name) => {
      obj[name] = obj[name] ?? 0;
      obj[name]++;
      return obj;
    },
    Object.create(null) as Record<string, number>,
  );
}

export function parseArgv(
  argv: Array<string> = process.argv.slice(2),
  hints: {
    [key: string]: Hint | undefined | null;
  } = {},
  {
    isAbsolute = path.isAbsolute,
    resolvePath = path.resolve,
    getCwd = process.cwd,
  }: {
    isAbsolute?: (somePath: string) => boolean;
    resolvePath?: (...parts: Array<string>) => string;
    getCwd?: () => string;
  } = {},
): {
  options: { [key: string]: any };
  positionalArgs: Array<string>;
  metadata: {
    keys: { [key: string]: string | undefined };
    hints: { [key: string]: string | undefined };
    guesses: { [key: string]: string | undefined };
  };
} {
  const options: { [key: string]: any } = {};
  const positionalArgs: Array<any> = [];
  const metadata: {
    keys: { [key: string]: string | undefined };
    hints: { [key: string]: string };
    guesses: { [key: string]: string };
  } = {
    keys: {},
    hints: {},
    guesses: {},
  };

  const usages = countFlagUsages(argv);

  let isAfterDoubleDash = false;
  while (argv.length > 0) {
    let item = argv.shift();
    if (item == null) break;

    if (item === "--") {
      isAfterDoubleDash = true;
      continue;
    }

    if (isAfterDoubleDash) {
      positionalArgs.push(item);
      continue;
    }

    if (item.startsWith("-")) {
      let propertyName: string;
      let rightHandValue: string | undefined;
      let valueComesFromNextArg: boolean;

      if (/=/.test(item)) {
        const equalsOffset = item.indexOf("=");
        const before = item.slice(0, equalsOffset);
        const after = item.slice(equalsOffset + 1);
        propertyName = convertToCamelCase(before);
        metadata.keys[before] = propertyName;
        rightHandValue = after;
        valueComesFromNextArg = false;
      } else {
        propertyName = convertToCamelCase(item);
        metadata.keys[item] = propertyName;
        rightHandValue = argv[0];
        valueComesFromNextArg = true;
      }

      let propertyValue:
        | string
        | number
        | boolean
        | Path
        | Array<string>
        | Array<number>
        | Array<boolean>
        | Array<Path>;
      let propertyHint = hints[propertyName];

      if (propertyHint == null) {
        propertyHint = bestGuess(rightHandValue);
        if (usages[propertyName] > 1) {
          propertyHint = hintToArrayHint(propertyHint);
        }
        metadata.guesses[propertyName] = hintToString(propertyHint);
      } else {
        metadata.hints[propertyName] = hintToString(propertyHint);
      }

      switch (propertyHint) {
        case arrayOfBooleans:
        case Boolean: {
          if (rightHandValue === "false") {
            if (valueComesFromNextArg) {
              argv.shift();
            }
            propertyValue = false;
          } else {
            if (rightHandValue === "true") {
              if (valueComesFromNextArg) {
                argv.shift();
              }
            }
            propertyValue = true;
          }

          if (propertyHint === arrayOfBooleans) {
            propertyValue = [propertyValue];
          }
          break;
        }

        case arrayOfNumbers:
        case Number: {
          if (valueComesFromNextArg) {
            argv.shift();
          }
          propertyValue = Number(rightHandValue);
          if (propertyHint === arrayOfNumbers) {
            propertyValue = [propertyValue];
          }
          break;
        }

        case arrayOfStrings:
        case String: {
          if (valueComesFromNextArg) {
            argv.shift();
          }
          propertyValue = rightHandValue;
          if (propertyHint === arrayOfStrings) {
            propertyValue = [propertyValue];
          }
          break;
        }

        case arrayOfPaths:
        case Path: {
          if (valueComesFromNextArg) {
            argv.shift();
          }
          propertyValue = isAbsolute(rightHandValue)
            ? new Path(rightHandValue)
            : new Path(resolvePath(getCwd(), rightHandValue));

          if (propertyHint === arrayOfPaths) {
            propertyValue = [propertyValue];
          }
          break;
        }

        default: {
          throw new Error(`Invalid option hint: ${propertyHint}`);
        }
      }

      if (Array.isArray(propertyValue)) {
        options[propertyName] ||= [];
        options[propertyName].push(...propertyValue);
      } else {
        options[propertyName] = propertyValue;
      }
    } else {
      positionalArgs.push(item);
    }
  }

  return {
    options,
    positionalArgs,
    metadata,
  };
}
