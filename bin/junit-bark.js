#!/usr/bin/env node
const fs = require("fs")

const getStdin = require("get-stdin")
const junitReportBuilder = require("junit-report-builder")
const tmp = require("tmp")

const resultRegex = new RegExp(/^[not]*\s*ok \d+ (.+)$/m);

(async () => {
    const tap = await getStdin()
    const tapLines = tap.split(/\r?\n/).splice(2) // ignore TAP version & plan
    const junitBuilder = junitReportBuilder.newBuilder()
    const outputFile = tmp.fileSync()

    let currentSuite
    let currentSuiteName
    let stdOut = ""
    let testCase

    tapLines.forEach(tapLine => {
        tapLine = `${tapLine}\n`

        let type = "extra"
        let ok = false
        let name = ""

        // parse tap line
        if (tapLine.startsWith("#")) {
            type = "comment"
        } else if (tapLine.match(resultRegex)) {
            type = "result"
            ok = tapLine.startsWith("ok")
            name = tapLine.match(resultRegex)[1]
        }

        // add line as a suite, case or stdout line
        if (type === "comment") {
            // test suite

            if (tapLine.includes("# FIXTURE ")) {
                // strip prefix and newline from comment to get suite name
                currentSuiteName = tapLine.replace("# FIXTURE ", "").replace(/\n/, "")

                currentSuite = junitBuilder.testSuite().name(currentSuiteName)
            }
        }
        else if (type === "extra") {
            // test case output

            stdOut += tapLine
        } else if (type === "result") {
            // test case result
            
            if (testCase && (stdOut !== "")) {
              testCase.standardOutput(stdOut)
            }

            testCase = currentSuite.testCase()
                .className(currentSuiteName)
                .name(name)

            if (!ok) {
                testCase.failure()
            }

            stdOut = ""
        }
    });

    // write to temp file because crappy API ¯\_(ツ)_/¯
    junitBuilder.writeTo(outputFile.name)

    console.log(
        // cleanup leading and trailing space before standard out CDATA
        fs.readFileSync(outputFile.name)
            .toString()
            .replace(/<system-out>.*?<!\[CDATA\[/gs, "<system-out><![CDATA[")
            .replace(/\n\]\]>.*?<\/system-out>/gs, "]]></system-out>")
    )
})()
