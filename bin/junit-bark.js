#!/usr/bin/env node
const fs = require("fs")

const eventsToArray = require("events-to-array")
const junitReportBuilder = require("junit-report-builder")
const TapParser = require('tap-parser')
const tmp = require("tmp")

const tapParser = new TapParser()
const tapResults = eventsToArray(
    tapParser, [
        'pipe',
        'unpipe',
        'prefinish',
        'finish',
        'line',
        'pass',
        'fail',
        'todo',
        'skip',
    ]
)

process.on("exit", () => {
    const junitBuilder = junitReportBuilder.newBuilder()
    const outputFile = tmp.fileSync()

    let currentSuite
    let currentSuiteName
    let stdOut = ""

    tapResults.forEach(result => {
        let type = result[0]
        let data = result[1]

        if (type === "comment") {
            // test suite

            if (data.includes("# FIXTURE ")) {
                // strip prefix and newline from comment to get suite name
                currentSuiteName = data.replace("# FIXTURE ", "").replace(/\n/, "")

                currentSuite = junitBuilder.testSuite().name(currentSuiteName)
            }
        }
        else if (type === "extra") {
            // test case output

            stdOut += data
        } else if (type === "result") {
            // test case result

            let testCase = currentSuite.testCase()
                .className(currentSuiteName)
                .name(data.name)
                .standardOutput(stdOut)

            if (!data.ok) {
                testCase.failure()
            }

            stdOut = ""
        }
    });

    junitBuilder.writeTo(outputFile.name)

    console.log(
        // cleanup leading and trailing space before standard out CDATA
        fs.readFileSync(outputFile.name)
            .toString()
            .replace(/<system-out>.*?<!\[CDATA\[/s, "<system-out><![CDATA[")
            .replace(/\n\]\]>.*?<\/system-out>/s, "]]></system-out>")
    )
})

process.stdin.pipe(tapParser)
