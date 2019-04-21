# junit-bark

JUnit reporter for [Alsatian](https://github.com/alsatian-test/alsatian).

## Why? What?

Alsatian outputs test results in TAP format. What is nice is that it includes standard out, which is not strictly part of the TAP standard.

Standard TAP reporters ignore standard out lines in Alsatian output.

This tool fixes that problem by parsing the TAP output from Alsatian and writing JUnit XML, which includes standard out for each test case as part of it's standard.

## How?

This module streams test results from TAP and uses `junit-report-builder` to build JUnit XML.

Given you have Alsatian installed, you can run:

```shell
alsatian --tap "./tests/**/*.js" | junit-bark
```

This will write the JUnit XML to standard out.

Fixtures are converted to test suites and any output from a test case is included in the standard out element.
