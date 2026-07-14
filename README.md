# clef-parse

The argv parser behind [cleffa](https://npm.im/cleffa) and [clefairy](https://npm.im/clefairy).

## Usage

### As a node.js library

```ts
import { parseArgv } from "clef-parse";

// Sample argv
const result = parseArgv([
  "--bundle",
  "--input",
  "index.js",
  "--output",
  "bundle.js",
  "-v",
]);
console.log(result);
// Logs:
// {
//   options: { bundle: true, input: 'index.js', output: 'bundle.js', v: true },
//   positionalArgs: []
// }

// Optionally, you can provide type hints that will help the parser coerce values:
const result2 = parseArgv(
  ["--bundle", "--input", "index.js", "--output", "bundle.js", "-v"],
  {
    bundle: Boolean,
    input: String,
    output: String,
    v: Boolean,
  },
);
console.log(result2);
// Logs:
// {
//   options: { bundle: true, input: 'index.js', output: 'bundle.js', v: true },
//   positionalArgs: []
// }

// Valid hints are Number, Boolean, String, Path, arrayOfNumbers, arrayOfBooleans, arrayOfStrings, or arrayOfPaths. Number, Boolean, and String are the standard JS globals, but the others are exported by clef-parse:
import { Path, arrayOfStrings /*, arrayOfNumbers, ... */ } from "clef-parse";

// When you provide the Path hint, clef-parse will interpret the input string as a path (relative to cwd unless it's absolute), and return a `Path` object (from the npm package "nice-path"). It will always be an absolute path.
const result3 = parseArgv(
  ["--bundle", "--input", "index.js", "--output", "bundle.js", "-v"],
  {
    bundle: Boolean,
    input: Path,
    output: Path,
    v: Boolean,
  },
);
console.log(result3);
// Logs (for example):
// {
//   options: {
//     bundle: true,
//     input: Path {
//       segments: [
//         "",
//         "home",
//         "suchipi",
//         "Code",
//         "clef-parse",
//         "index.js",
//       ],
//       separator: "/",
//     },
//     output: Path {
//       segments: [
//         "",
//         "home",
//         "suchipi",
//         "Code",
//         "clef-parse",
//         "bundle.js",
//       ],
//       separator: "/",
//     },
//     v: true
//   },
//   positionalArgs: []
// }

// When you provide an arrayOf* hint, all invocations of the flag will be gathered into an array (ie. repeated invocations are allowed):
const result4 = parseArgv(
  ["--include", "something", "--include", "something_else"],
  { include: arrayOfStrings },
);
console.log(result4);
// Logs:
// {
//   options: { include: [ 'something', 'something_else' ] },
//   positionalArgs: [],
// }

// If you don't provide hints, clef-parse will do its best to guess.
```

See the TypeScript types in the source code for more information.

### As a CLI tool

When used as a CLI tool, clef-parse prints a JSON object with the result of parsing the argv it received:

```sh
$ npm install -g clef-parse
$ clef-parse one two --three-four=five
{
  "options": {
    "threeFour": "five"
  },
  "positionalArgs": [
    "one",
    "two"
  ]
}
```

To specify hints with the CLI tool, use environment variables named like `CLEF_PARSE_HINT_<option name goes here>`. For instance:

```sh
# Without any hints specified, --with-batteries is parsed as a string:
$ clef-parse some stuff --with-batteries yeah yup
{
  "options": {
    "withBatteries": "yeah"
  },
  "positionalArgs": [
    "some",
    "stuff",
    "yup"
  ]
}
# But specifying the hint as boolean treats the next value as a positional arg:
$ env CLEF_PARSE_HINT_WITH_BATTERIES=Boolean clef-parse some stuff --with-batteries yeah yup
{
  "options": {
    "withBatteries": true
  },
  "positionalArgs": [
    "some",
    "stuff",
    "yeah",
    "yup"
  ]
}
```

## License

MIT
