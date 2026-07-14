#!/usr/bin/env node
import {
  parseArgv,
  Path,
  arrayOfBooleans,
  arrayOfNumbers,
  arrayOfPaths,
  arrayOfStrings,
} from "./index";
import { convertToCamelCase } from "./convert-case";

const envVarNames = Object.keys(process.env);
const clefParseEnvVarNames = envVarNames.filter((name) =>
  name.startsWith("CLEF_PARSE_"),
);
const clefParseEnvVars = Object.fromEntries(
  clefParseEnvVarNames.map((name) => [name, process.env[name]]),
);

const offset = Number(clefParseEnvVars.CLEF_PARSE_ARGV_OFFSET || "2");

const possibleHintValues = {
  Boolean,
  String,
  Number,
  Path,
  arrayOfStrings,
  arrayOfBooleans,
  arrayOfNumbers,
  arrayOfPaths,
};

const hints = {};
for (const [name, value] of Object.entries(clefParseEnvVars)) {
  if (!name.startsWith("CLEF_PARSE_HINT_")) {
    continue;
  }
  const hintKey = convertToCamelCase(name.replace(/^CLEF_PARSE_HINT_/, ""));
  const hintValue = possibleHintValues[value || ""];
  if (hintValue == null) {
    throw new Error(
      `Invalid hint specified by env var '${name}'. Valid values are "Boolean", "String", "Number", "Path", "arrayOfStrings", "arrayOfBooleans", "arrayOfNumbers", or "arrayOfPaths", but received: ${value}.`,
    );
  }

  hints[hintKey] = hintValue;
}

const result = parseArgv(process.argv.slice(offset), hints);
console.log(JSON.stringify(result, null, 2));
