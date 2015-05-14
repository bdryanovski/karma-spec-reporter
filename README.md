# karma-spec-reporter-2

Test reporter, that prints detailed results to console (similar to mocha's spec reporter).
Based on the `npm install karma-spec-reporter` - but with few changes

# Installation

```bash
  $ npm install karma-spec-reporter-2
```

There are few configuration that you could apply to the reporter.
``` js
//karma.conf.js
...
  config.set({
    ...
      reporters: ["spec"],
      specReporter: {

        // When test faild - report it at the end of all tests 
        lateReport:      true,

        // Max Error log lines to display
        maxLogLines:     5,

        // Don't show faild tests
        suppressFaild:   false,

        // Don't show successful tests
        suppressSuccess: false,

        // Don't show skipped tests
        suppressSkipped: false,

        // Every test that is more slower than the slowest test is mark as slow
        slowTestTime: 40,
        fastTestTime: 20

      },
      plugins: ["karma-spec-reporter"],
    ...
```

Take a look at the [karma-spec-reporter-example](http://github.com/mlex/karma-spec-reporter-example) repository to see the reporter in action.
