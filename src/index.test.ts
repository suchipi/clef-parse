import { test, expect } from "vitest";
import {
  parseArgv,
  Path,
  arrayOfStrings,
  arrayOfPaths,
  arrayOfNumbers,
  arrayOfBooleans,
} from "./index";

test("basic test", () => {
  const result = parseArgv(["-v", "--some-flag", "52", "potato", "--", "--hi"]);

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {
          "someFlag": "number",
          "v": "boolean",
        },
        "hints": {},
        "keys": {
          "--some-flag": "someFlag",
          "-v": "v",
        },
      },
      "options": {
        "someFlag": 52,
        "v": true,
      },
      "positionalArgs": [
        "potato",
        "--hi",
      ],
    }
  `);
});

test("basic test (underscores in property names)", () => {
  const result = parseArgv(["-v", "--some_flag", "52", "potato", "--", "--hi"]);

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {
          "someFlag": "number",
          "v": "boolean",
        },
        "hints": {},
        "keys": {
          "--some_flag": "someFlag",
          "-v": "v",
        },
      },
      "options": {
        "someFlag": 52,
        "v": true,
      },
      "positionalArgs": [
        "potato",
        "--hi",
      ],
    }
  `);
});

test("boolean hint", () => {
  const result = parseArgv(["-v", "potato"], { v: Boolean });

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {},
        "hints": {
          "v": "boolean",
        },
        "keys": {
          "-v": "v",
        },
      },
      "options": {
        "v": true,
      },
      "positionalArgs": [
        "potato",
      ],
    }
  `);
});

test("number hint", () => {
  const result = parseArgv(
    ["--some-num", "500", "--another-num", "this is a string tho"],
    { someNum: Number, anotherNum: Number },
  );

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {},
        "hints": {
          "anotherNum": "number",
          "someNum": "number",
        },
        "keys": {
          "--another-num": "anotherNum",
          "--some-num": "someNum",
        },
      },
      "options": {
        "anotherNum": NaN,
        "someNum": 500,
      },
      "positionalArgs": [],
    }
  `);
});

test("null and undefined", () => {
  const result = parseArgv(["--first", "null", "--second", "undefined"]);

  // They get treated as strings.
  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {
          "first": "string",
          "second": "string",
        },
        "hints": {},
        "keys": {
          "--first": "first",
          "--second": "second",
        },
      },
      "options": {
        "first": "null",
        "second": "undefined",
      },
      "positionalArgs": [],
    }
  `);
});

test("null and undefined with String hint", () => {
  const result = parseArgv(["--first", "null", "--second", "undefined"], {
    first: String,
    secong: String,
  });

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {
          "second": "string",
        },
        "hints": {
          "first": "string",
        },
        "keys": {
          "--first": "first",
          "--second": "second",
        },
      },
      "options": {
        "first": "null",
        "second": "undefined",
      },
      "positionalArgs": [],
    }
  `);
});

test("empty", () => {
  const result = parseArgv([]);

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {},
        "hints": {},
        "keys": {},
      },
      "options": {},
      "positionalArgs": [],
    }
  `);
});

test("empty string arg", () => {
  const result = parseArgv([""]);

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {},
        "hints": {},
        "keys": {},
      },
      "options": {},
      "positionalArgs": [
        "",
      ],
    }
  `);
});

test("path hint (./)", () => {
  const result = parseArgv(
    [
      "--first-thing",
      "./blah",
      "--second-thing",
      "./blah",
      "--third-thing",
      "./blah",
    ],
    { firstThing: String, secondThing: Path },
    { getCwd: () => "/some/fake/path" },
  );

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {
          "thirdThing": "string",
        },
        "hints": {
          "firstThing": "string",
          "secondThing": "path",
        },
        "keys": {
          "--first-thing": "firstThing",
          "--second-thing": "secondThing",
          "--third-thing": "thirdThing",
        },
      },
      "options": {
        "firstThing": "./blah",
        "secondThing": Path {
          "segments": [
            "",
            "some",
            "fake",
            "path",
            "blah",
          ],
          "separator": "/",
        },
        "thirdThing": "./blah",
      },
      "positionalArgs": [],
    }
  `);
});

test("path hint (../)", () => {
  const result = parseArgv(
    [
      "--first-thing",
      "../blah",
      "--second-thing",
      "../blah",
      "--third-thing",
      "../blah",
    ],
    { firstThing: String, secondThing: Path },
    { getCwd: () => "/some/fake/path" },
  );

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {
          "thirdThing": "string",
        },
        "hints": {
          "firstThing": "string",
          "secondThing": "path",
        },
        "keys": {
          "--first-thing": "firstThing",
          "--second-thing": "secondThing",
          "--third-thing": "thirdThing",
        },
      },
      "options": {
        "firstThing": "../blah",
        "secondThing": Path {
          "segments": [
            "",
            "some",
            "fake",
            "blah",
          ],
          "separator": "/",
        },
        "thirdThing": "../blah",
      },
      "positionalArgs": [],
    }
  `);
});

test("path hint (unqualified input)", () => {
  const result = parseArgv(
    [
      "--first-thing",
      "blah",
      "--second-thing",
      "blah",
      "--third-thing",
      "blah",
    ],
    { firstThing: String, secondThing: Path },
    { getCwd: () => "/some/fake/path" },
  );

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {
          "thirdThing": "string",
        },
        "hints": {
          "firstThing": "string",
          "secondThing": "path",
        },
        "keys": {
          "--first-thing": "firstThing",
          "--second-thing": "secondThing",
          "--third-thing": "thirdThing",
        },
      },
      "options": {
        "firstThing": "blah",
        "secondThing": Path {
          "segments": [
            "",
            "some",
            "fake",
            "path",
            "blah",
          ],
          "separator": "/",
        },
        "thirdThing": "blah",
      },
      "positionalArgs": [],
    }
  `);
});

test("relative path without hint specified", () => {
  const result = parseArgv(
    [
      "--first-thing",
      "blah",
      "--second-thing",
      "./blah",
      "--third-thing",
      "../blah",
    ],
    {},
    { getCwd: () => "/some/fake/path" },
  );

  // You can only make a path via hint.
  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {
          "firstThing": "string",
          "secondThing": "string",
          "thirdThing": "string",
        },
        "hints": {},
        "keys": {
          "--first-thing": "firstThing",
          "--second-thing": "secondThing",
          "--third-thing": "thirdThing",
        },
      },
      "options": {
        "firstThing": "blah",
        "secondThing": "./blah",
        "thirdThing": "../blah",
      },
      "positionalArgs": [],
    }
  `);
});

test("single-dash multi-char property name", () => {
  const result = parseArgv(["-version", "-help", "yeah"]);

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {
          "help": "string",
          "version": "boolean",
        },
        "hints": {},
        "keys": {
          "-help": "help",
          "-version": "version",
        },
      },
      "options": {
        "help": "yeah",
        "version": true,
      },
      "positionalArgs": [],
    }
  `);
});

test("property name and value in one arg separated by equals", () => {
  const result = parseArgv([
    "-s=1",
    "--something=true",
    "--no-equals",
    "here",
    "--another_thing=yup",
    "--without-equals",
    "again",
  ]);

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {
          "anotherThing": "string",
          "noEquals": "string",
          "s": "number",
          "something": "boolean",
          "withoutEquals": "string",
        },
        "hints": {},
        "keys": {
          "--another_thing": "anotherThing",
          "--no-equals": "noEquals",
          "--something": "something",
          "--without-equals": "withoutEquals",
          "-s": "s",
        },
      },
      "options": {
        "anotherThing": "yup",
        "noEquals": "here",
        "s": 1,
        "something": true,
        "withoutEquals": "again",
      },
      "positionalArgs": [],
    }
  `);
});

test("example: ffmpeg argv", () => {
  const result = parseArgv([
    // argv0 is "ffmpeg", so it would go here, but parseArgv doesn't expect argv0
    "-i",
    "demo.mov",
    "-c:v",
    "libx265",
    "-crf",
    "28",
    "demo_out.mp4",
  ]);
  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {
          "cV": "string",
          "crf": "number",
          "i": "string",
        },
        "hints": {},
        "keys": {
          "-c:v": "cV",
          "-crf": "crf",
          "-i": "i",
        },
      },
      "options": {
        "cV": "libx265",
        "crf": 28,
        "i": "demo.mov",
      },
      "positionalArgs": [
        "demo_out.mp4",
      ],
    }
  `);
});

test("repeated flag with arrayOfStrings hint vs String hint", () => {
  const result = parseArgv(
    [
      "--blah",
      "one",
      "--blah",
      "two",
      "--other-blah",
      "three",
      "--other-blah",
      "four",
    ],
    { blah: String, otherBlah: arrayOfStrings },
  );

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {},
        "hints": {
          "blah": "string",
          "otherBlah": "array of strings",
        },
        "keys": {
          "--blah": "blah",
          "--other-blah": "otherBlah",
        },
      },
      "options": {
        "blah": "two",
        "otherBlah": [
          "three",
          "four",
        ],
      },
      "positionalArgs": [],
    }
  `);
});

test("arrayOfStrings hint with only one value is still an array", () => {
  const result = parseArgv(["--blah", "one"], { blah: arrayOfStrings });

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {},
        "hints": {
          "blah": "array of strings",
        },
        "keys": {
          "--blah": "blah",
        },
      },
      "options": {
        "blah": [
          "one",
        ],
      },
      "positionalArgs": [],
    }
  `);
});

test("repeated flag without hint gets guessed as array", () => {
  const result = parseArgv(["--blah", "one", "--blah", "two", "--blah=three"]);

  expect(result).toMatchInlineSnapshot(`
    {
      "metadata": {
        "guesses": {
          "blah": "array of strings",
        },
        "hints": {},
        "keys": {
          "--blah": "blah",
        },
      },
      "options": {
        "blah": [
          "one",
          "two",
          "three",
        ],
      },
      "positionalArgs": [],
    }
  `);
});
