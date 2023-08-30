import { test, expect } from "vitest";
import { parseArgv, Path } from "./index";

test("basic test", () => {
  const result = parseArgv(["-v", "--some-flag", "52", "potato", "--", "--hi"]);

  expect(result).toMatchInlineSnapshot(`
    {
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
    { someNum: Number, anotherNum: Number }
  );

  expect(result).toMatchInlineSnapshot(`
    {
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
      "options": {},
      "positionalArgs": [],
    }
  `);
});

test("empty string arg", () => {
  const result = parseArgv([""]);

  expect(result).toMatchInlineSnapshot(`
    {
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
    { getCwd: () => "/some/fake/path" }
  );

  expect(result).toMatchInlineSnapshot(`
      {
        "options": {
          "firstThing": "./blah",
          "secondThing": "/some/fake/path/blah",
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
    { getCwd: () => "/some/fake/path" }
  );

  expect(result).toMatchInlineSnapshot(`
    {
      "options": {
        "firstThing": "../blah",
        "secondThing": "/some/fake/blah",
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
    { getCwd: () => "/some/fake/path" }
  );

  expect(result).toMatchInlineSnapshot(`
      {
        "options": {
          "firstThing": "blah",
          "secondThing": "/some/fake/path/blah",
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
    { getCwd: () => "/some/fake/path" }
  );

  // You can only make a path via hint.
  expect(result).toMatchInlineSnapshot(`
      {
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
