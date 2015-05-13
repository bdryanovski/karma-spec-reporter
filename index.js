require('colors')

var SpecReporter = function(baseReporterDecorator, config, logger, helper, formatError) {

  var cfg = {

    maxLogLines: undefined,

    /* Use colors or not? */
    colors: config.colors || true,

    lateReport: config.specReporter.lateReport || true,

    /* Skip some part of the reports */
    suppressFailed:  config.specReporter.suppressFailed || false,
    suppressSuccess: config.specReporter.suppressSuccess || false,
    suppressSkipped: config.specReporter.suppressSkipped || false,

    /* Prefixe use for decoration on the reporter */
    prefix: {
      success: '✓ ',
      failure: '✗ ',
      skipped: '  '
    },

    /* Time ranges */
    fast: 20,
    slow: 40
  }

  // We wish to build on the basic reporter's properties and methods
  baseReporterDecorator(this)

  // We wish to send to the output to the console, and that every message we output will
  // be on a different line
  this.adapters = [function(msg) { 
      process.stdout.write.bind(process.stdout)(msg + "\r\n")
  }]

  this.currentSuite = []
  this.faildTests   = []

  /* 
  * Templates 
  */
  this.BROWSER_REGISTER = 'INFO %s is register\n'
  this.LOG_SINGLE_BROWSER = 'INFO %s LOG: %s\n'
  this.BROWSER_COMPLETE = 'INFO %s COMPLETE: %s SUCCESS, %s SKIPPED, %s FAILED, %s TOTAL, %s TOTAL TIME (ms)\n'
  this.LATE_REPORT = '\nERROR THERE %s FAILD TESTS:\n'

  this.SUCCESS = cfg.prefix.success + '- %s'
  this.SKIPPED = cfg.prefix.skipped + '- %s'
  this.FAILED  = cfg.prefix.failure + '- %s'

  /* Add color if needed */
  if (cfg.colors) {
    this.BROWSER_REGISTER   = this.BROWSER_REGISTER.yellow
    this.LOG_SINGLE_BROWSER = this.LOG_SINGLE_BROWSER.yellow
    this.BROWSER_COMPLETE   = 'INFO '.yellow + '%s'.cyan + ' COMPLETE: '.yellow + '%s'.green + ' SUCCESS, '.yellow + '%s'.grey + ' SKIPPED, '.yellow + '%s'.red + ' FAILED, '.yellow + '%s'.magenta +' TOTAL, %s TOTAL TIME (ms)\n'.yellow
    this.LATE_REPORT        = this.LATE_REPORT.red

    this.SUCCESS = this.SUCCESS.green
    this.SKIPPED = this.SKIPPED.grey
    this.FAILED  = this.FAILED.red
  }

  /*
  * Util function
  */

  /*
  * Get suites and print them
  * also return indent level
  *
  */
  this.suiteFormat = function(suite, self) {
    var indent = "  "
    suite.forEach(function(value, index) {
        if (index >= self.currentSuite.length || self.currentSuite[index] != value) {
          if (index === 0) self.writeCommonMsg('\n')

          self.writeCommonMsg(indent + value)
          self.currentSuite = []
        }
        indent += "  "
        
    }, self)

    self.currentSuite = suite

    return { indent: indent, suite: suite }
  }

  /*
  * Format the time that the test wsa running 
  */
  this.testTime = function(time) {
    var result = " ( " + time + " ms )"

    if (cfg.colors) {
      if (time > cfg.fast && time < cfg.slow) {
        result = result.yellow
      } else if (time < cfg.fast) {
        result = result.green
      } else if (time > cfg.slow) {
        result = result.red
      }
    }

    return result
  }

  /*
  * Backtrace the log
  */
  this.backtrace = function(log) {
    var result = '\n'
    log.forEach(function(log) {
        if (cfg.maxLogLines) {
          log = log.split('\n').slice(0, cfg.maxLogLines).join('\n')
        } 
        result += '\n' + formatError(log, '\t')
    })
    if (cfg.colors) {
      result = result.red
    }
    return result
  }

  /*
  * LateReport will display more information about the faild test on the end of the run
  * this is more easy way to see what really happened and don't scroll to much 
  */
  this.lateReport = function() {
    if (this.faildTests.length > 0) {

      this.write(this.LATE_REPORT, this.faildTests.length)

      this.faildTests.forEach(function(result) {

          var data = this.suiteFormat(result.suite, this)
          var indent = data.indent
          var time = this.testTime(result.time)

          var msg = indent + this.FAILED + time
          msg += this.backtrace(result.log)

          this.writeCommonMsg(msg, result.description)

      }, this)
      
      this.faildTests = []
    }
  }

  /*
  * The launcher initiates tests on the browser ( browser init and browser reconnect )
  *
  * Browser: 
  *  - id
  *  - fullName
  *  - name
  *  - state
  *  - lastResult
  *     - success <number>
  *     - failed <number>
  *     - skipped <number>
  *     - tatal
  *     - totalTime
  *     - netTime
  *     - error <boolean>
  *     - disconnected
  *     - totalTimeEnd
  *  - disconnectsCount
  */
  this.onBrowserRegister = function(browser) {
    this.write(this.BROWSER_REGISTER, browser.fullName)
  }

  /*
  * Browsers are ready and execution starts
  *
  * BrowserCollections methods:
  *   - add
  *   - remove
  *   - getById
  *   - setAllToExecuting
  *   - AreAllReady
  *   - serialize
  *   - getResults
  *   - clearResults
  *   - clone
  *   - map 
  *   - forEach
  *
  */
  // this.onRunStart = function(browserCollections) {
  // }

  /*
  * current browser changes, triggered when the browser is registered and when
  * tests complete on the browser
  */
  // this.onBrowserChange = function(browserCollections){
  // }

  /*
  * The browser connects to the server 
  */
  // this.onBrowserStart = function(browser, info) {
  // }

  /*
  * getting a result from a test(spec)
  *
  * result <Array>:
  *   - id
  *   - description
  *   - suite <Array>
  *   - success <boolean>
  *   - skipped <boolean>
  *   - time <int> (ms)
  *   - log <array>
  *   
  */
  // this.onSpecComplete = function(browser, result) {
  //   if (result.skipped) {
  //     return this.specSkipped(browser, result)
  //   }
  //
  //   if (result.success) {
  //     return this.specSuccess(browser, result)
  //   }
  //
  //   return this.specFailure(browser, result)
  // }

  /*
  * base reporte's onSpecomplete was called
  */

  /* SUCCESS */

  this.specSuccess = function(browser, result) {
    var data = this.suiteFormat(result.suite, this)
    var indent = data.indent
    var time = this.testTime(result.time)

    var msg = indent + this.SUCCESS + time

    this.writeCommonMsg(msg, result.description)
  }

  /* SKIPPED */
  this.specSkipped = function(browser, result) {
    var data = this.suiteFormat(result.suite, this)
    var indent = data.indent
    var time = this.testTime(result.time)

    var msg = indent + this.SKIPPED + time

    this.writeCommonMsg(msg, result.description)
  }

  /* FAILURE */
  this.specFailure = function(browser, result) {
    var data = this.suiteFormat(result.suite, this)
    var indent = data.indent
    var time = this.testTime(result.time)

    var msg = indent + this.FAILED + time
    if (cfg.lateReport === false && result.log) {
      msg += this.backtrace(result.log)
    } else {
      this.faildTests.push(result)
    }

    this.writeCommonMsg(msg, result.description)

  }

  /*
  * nothing - this function is just to stup the method and do nothing
  */
  this.nothing = function() { /* Do nothing */ }

  /* Link function and disabled some kind of reports */
  this.specSuccess = cfg.suppressSuccess ? this.nothing : this.specSuccess
  this.specSkipped = cfg.suppressSkipped ? this.nothing : this.specSkipped
  this.specFailure = cfg.suppressFailure ? this.nothing : this.specFailure

  /*
  * finished running tests on a browser, browser disconnect, browser timeout
  */
  this.onBrowserComplete = function(browser) {

    if (cfg.lateReport === true) {
      this.lateReport()
    }

    this.write(
      this.BROWSER_COMPLETE,
      browser.name, 
      browser.lastResult.success, 
      browser.lastResult.skipped, 
      browser.lastResult.failed,
      browser.lastResult.total,
      browser.lastResult.totalTime
    )
  }

  /*
  * the browser encountered an error connecting to server
  */
  this.onBrowserError = function(browser, error) {
  }

  /*
  * the browser send info to the server
  */
  this.onBrowserLog = function(browser, log, type) {
    this.write(this.LOG_SINGLE_BROWSER, browser, type.toUpperCase())
  }

  /*
  * finished running on all browsers
  */
  this.onRunComplete = function(browserCollection, results) {
    this.write('Goodbye')
  }

  /*
  * before exiting Karma
  */
  this.onExit = function(callback) {
  }
}

SpecReporter.$inject = ['baseReporterDecorator', 'config', 'logger', 'helper', 'formatError']

module.exports = {
  'reporter:spec': ['type', SpecReporter]
}
