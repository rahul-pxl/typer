/* The MIT License (MIT)

Copyright (c) 2017 Aaron Cordova

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */

function typer(el, speed) {
  let q = []; // The main array to contain all the methods called on typer.

  // List of HTML void elements (http://goo.gl/SWmyS5),
  // used in 'processMsg' & 'processBack'.
  q.voids = ['area','base','br','col','command','embed','hr','img','input','keygen','link','meta','param','source','track','wbr'];

  // Various checks.
  speed = speed || 70;
  if (getType(el) !== 'String') throw 'typer error: selector provided is not a string.';
  if (!document.styleSheets.length) styleSheets(); // Create a stylesheet if none exist.

  el = document.querySelector(el);

  parentDataNum(); // Assign a random # to the parent el's data attribute.

  // Public methods.
  let typerObj = {
    cursor: function(cursorObj) {
      // Prevent cursor from being run multiple times.
      if (q.cursorRan) {
        console.log('You can only call ".cursor" once.');
        return this;
      }

      q.cursorRan = true;

      // Prevent errors from no arguments.
      if (cursorObj === undefined) cursorObj = true;

      // No cursor.
      if (cursorObj === false) {
        q.cursor = 'no-cursor'; // Used as a class.
        return this;
      }

      let cursor = [];
      let data = `[data-typer="${q.dataNum}"]`;

      // Optional cursor color - https://goo.gl/b4Ckz9
      if (cursorObj.color) addStyle(`${data} .typer::after`, `background-color:${cursorObj.color}`);

      // Cursor's blinking style - default to soft.
      cursorObj.blink === 'hard' ? cursor.push('cursor-hard') : cursor.push('cursor-soft');

      // Cursor: block or line.
      if (cursorObj.block === true) cursor.push('cursor-block');

      q.cursor = cursor.join(' '); // Used as a class.

      return this;
    },
    line: function(msg, spd, html) {
      msg ? q.push(lineOrContinue('line', msg, spd, html)) : q.push({line: 1});

      // Push the first dominoe on the typing iteration,
      // ensuring public methods will only call 'processq()' once.
      if (!q.typing) {
        q.typing = true;
        processq();
      }

      return this;
    },
    continue: function(msg, spd, html) {
      if (!msg) return this; // Ignore empty continues.
      q.push(lineOrContinue('continue', msg, spd, html));
      return this;
    },
    pause: function(num) {
      // Default to 500ms.
      q.push({pause: num || 500});
      return this;
    },
    emit: function(event, el) {
      if (!el) el = 'body'; // Default to the body.

      // Simple way to throw an error for invalid selectors.
      document.querySelector(el);

      q.push({emit: event, el: el});
      return this;
    },
    listen: function(event, el) {
      if (!el) el = 'body'; // Default to the body.

      // Simple way to throw an error for invalid selectors.
      document.querySelector(el);

      q.push({listen: event, el: el});
      return this;
    },
    back: function(chars, spd) {
      if (spd === 0) spd++;
      q.push({back: chars, speed: spd || speed});
      return this;
    },
    empty: function() {
      q.push({empty: true});
      return this;
    },
    run: function(fxn) {
      q.push({run: fxn});
      return this;
    },
    end: function(fxn, e) {
      q.push({end: true});

      q.cb = function() {
        // Finalize the the div class names before ending.
        // Because wack IE doesn't support multiple parameters for .remove or .add.
        ['typer', 'cursor-block', 'cursor-soft', 'cursor-hard', 'no-cursor'].forEach(name => {
          q.newDiv.classList.remove(name);
        });

        q.newDiv.classList.add('white-space');
        q.newDiv = '';

        if (fxn && fxn instanceof Function) fxn(el);
        if ((fxn && getType(fxn) === 'Boolean') || e) {
          if (e instanceof Function) e(el);
          document.body.dispatchEvent(new Event('typerFinished'));
        }
      }

      // A convenient object to warn the user if they
      // try to call any methods after '.end'.
      let catchAll = {
        cursor: message,
        line: message,
        continue: message,
        pause: message,
        emit: message,
        listen: message,
        back: message,
        empty: message,
        run: message,
        end: message
      };

      // Message used by the 'catchAll' object.
      function message() {
        console.log('WARNING: you tried to call a method after ".end" has already been called.');
        return catchAll;
      }

      return catchAll;
    }
  };

  // Private functions.
  function getType(thing) {
    let type = ({}).toString.call(thing);

    return type.split(' ')[1].slice(0, -1);
  }
  function parentDataNum() {
    // Random # function with min & max values.
    // function randomNum(min, max) {
    //   return Math.floor(Math.random() * (max - min + 1) + min);
    // }
    q.dataNum = Math.floor(Math.random() * 999999999 + 1);
    el.setAttribute('data-typer', q.dataNum);
  }
  function styleSheets() { // https://goo.gl/b4Ckz9
    // Create the style element.
    let style = document.createElement('style');

    // Webkit hack.
    style.appendChild(document.createTextNode(''));

    // Append the style element to the head.
    document.head.appendChild(style);
  }
  function addStyle(selector, rules) { // https://goo.gl/b4Ckz9
    let sheet = document.styleSheets[0];

    if ('insertRule' in sheet) {
      sheet.insertRule(`${selector}{${rules}}`, 1);
    } else {
      sheet.addRule(selector, rules);
    }
  }
  function lineOrContinue(choice, msg, spd, html) {
    let obj = {html: (spd === false || html === false) ? false : true};

    if (getType(spd) === 'Number') obj.speed = spd;
    if (getType(html) === 'Number') obj.speed = html;
    if (getType(msg) === 'Object') {
      // Prevents a hard dependency on 'el' as the property name.
      let key = Object.keys(msg)[0];
      msg = document.querySelector(msg[key])[obj.html ? 'innerHTML': 'textContent'].trim();
    }

    obj[choice] = msg;

    return obj;
  }
  function processq() { // Begin our main iterator.
    if (!(q.item >= 0)) q.item = 0;
    if (q.item === q.length) return document.body.removeEventListener('killTyper', q.kill);
    if (!q.ks) {
      q.ks = true;
      document.body.addEventListener('killTyper', q.kill);
    }

    // If no cursor is declared, resort to default styling.
    // The cursor will be pinged later by each line.
    if (!q.cursor) q.cursor = 'cursor-soft';

    // Main iterator.
    q.type = setInterval(function() {
      let item = q[q.item];

      // Various processing functions.
      item.line ? processLine(item) :
      item.continue ? processContinue(item) :
      item.pause ? processPause(item) :
      item.emit ? processEmit(item) :
      item.listen ? processListen(item) :
      item.back ? processBack(item) :
      item.empty ? processEmpty() :
      item.run ? processRun(item) :
      item.end && processEnd(item);
    }, 0);
  }
  function processMsg(item) { // Used by 'processLine' & 'processContinue'.
    let msg = item.line || item.continue;
    let div = document.createElement('div');

    div.innerHTML = msg;
    item.html ? html() : plain();

    function html() {
      let list = createTypingArray(div.childNodes, q.newDiv);
      let objCounter = 0;
      let textCounter = 0;
      let obj = list[objCounter++];

      q.iterator = setInterval(() => {
        // Finished processing everything.
        if (!obj) return moveOn();

        // Text node.
        if (obj.content) {
          obj.parent.innerHTML += obj.content[textCounter++];

          // Finished typing.
          if (textCounter === obj.content.length) {
            textCounter = 0;
            obj = list[objCounter++]
          }

        // Element node.
        } else {
          obj.parent.appendChild(obj.newNode);
          obj = list[objCounter++];
        }
      }, item.speed || speed);
    }

    function plain() {
      let counter = 0;

      q.iterator = setInterval(() => {
        // End of message processing logic.
        if (counter === msg.length) {
          clearInterval(q.iterator);
          q.item++; // Increment our main item counter.
          return processq(); // Restart the main iterator.
        }

        let piece = msg[counter];

        // Avoid HTML parsing on supplied arrays.
        if (typeof msg !== 'string') {
          div.textContent = piece;
          piece = div.innerHTML;
        }

        q.newDiv.innerHTML += piece;
        counter++;
      }, item.speed || speed);
    }

    function createTypingArray(childNodes, parent) {
      let arr = [];
      childNodes = Array.from(childNodes);

      for (let i = 0; i < childNodes.length; i++) {
        let node = childNodes[i];
        let name = node.nodeName;

        if (name === '#text') {
          // Only text nodes will get the content property.
          arr.push({
            parent: parent,
            content: node.textContent
          });
        } else if (node.childNodes.length) {
          // 1. Clone to an empty node.
          let newNode = document.createElement(name);

          // 2. Copy the attributes.
          copyAttributes(node, newNode);

          arr.push({
            parent: parent,
            newNode: newNode,
          });

          arr = [...arr, ...createTypingArray(node.childNodes, newNode)];
        }
      }

      return arr;
    }

    // Stop the typing iteration & move on to our main iteration.
    function moveOn() {
      clearInterval(q.iterator);
      q.item++; // Increment our main item counter.
      return processq(); // Restart the main iterator.
    }

    function copyAttributes(source, target) {
      Array.from(source.attributes).forEach(attr => {
        target.setAttribute(attr.name, attr.value);
      });
    }
  }
  function processLine(item) {
    // Stop the main iterator.
    clearInterval(q.type);

    // Process the previous line if there was one.
    if (q.newDiv) {
      // Because wack IE doesn't support multiple parameters for .remove or .add.
      ['typer', 'cursor-block', 'cursor-soft', 'cursor-hard', 'no-cursor'].forEach(name => {
        q.newDiv.classList.remove(name);
      });

      q.newDiv.classList.add('white-space');

      if (q.newDiv.innerHTML === '') q.newDiv.innerHTML = ' '; // Retains the height of a single line.
    }

    // Create new div.
    let div = document.createElement('div');
    div.setAttribute('data-typer-child', q.dataNum);
    div.className = q.cursor;
    div.classList.add('typer');
    div.classList.add('white-space');

    el.appendChild(div);
    q.newDiv = div;

    // If our line has no contents...
    if (item.line === 1) {
      q.item++;
      return processq();
    }

    // Message iterator.
    processMsg(item);
  }
  function processContinue(item) {
    clearInterval(q.type); // Stop the main iterator.
    processMsg(item); // Message iterator.
  }
  function processPause(item) {
    clearInterval(q.type); // Stop the main iterator.

    q.pause = setTimeout(() => {
      q.item++; // Increment our main item counter.
      processq(); // Restart the main iterator.
    }, item.pause);
  }
  function processEmit(item) {
    clearInterval(q.type); // Stop the main iterator.
    document.querySelector(item.el).dispatchEvent(new Event(item.emit));

    q.item++;
    processq();
  }
  function processListen(item) {
    clearInterval(q.type); // Stop the main iterator.

    let el = document.querySelector(item.el);

    // One-time event listener.
    el.addEventListener(item.listen, function handler(e) {
      el.removeEventListener(e.type, handler);
      if (q.killed) return; // Prevent error if kill switch is engaged.
      q.item++;
      processq();
    });
  }
  function processBack(item) {
    // Stop the main iterator.
    clearInterval(q.type);

    // Check for being called on an empty line.
    if (!q.newDiv || !q.newDiv.textContent) {
      q.item++;
      return processq();
    }

    // Empty the line all at once.
    if (item.back === 'empty') {
      q.newDiv.innerHTML = '';
      q.item++;
      return processq();
    }

    // Prevent larger 'back' quantities from needlessly interrupting the flow.
    if (item.back > q.newDiv.innerHTML.length) item.back = 'all';

    // A simple way to erase the whole line without knowing the contents:
    // set the # of 'backspaces' to the content's length.
    if (item.back === 'all') item.back = q.newDiv.textContent.length;

    // Negative #'s are an easy way to say "erase all BUT X-amount of characters."
    if (item.back < 0) {
      let text = q.newDiv.textContent;
      item.back = text.slice(item.back).length;
    }

    let counter = 0;
    let contents = flattenContents(q.newDiv).reverse();

    q.goBack = setInterval(function() {
      if (!contents[0].length) contents.shift();

      let node = contents[0];

      node.textContent = node.textContent.slice(0, -1);
      counter++;

      // Exit.
      if (counter === item.back) {
        clearInterval(q.goBack);
        removeEmpties(q.newDiv);
        q.item++;
        processq();
      }
    }, item.speed || speed);

    function flattenContents(parent) {
      let arr = [];
      let childNodes = Array.from(parent.childNodes);

      if (!childNodes.length) return arr;

      childNodes.forEach(child => {
        if (child.childNodes.length) {
          arr = [...arr, ...flattenContents(child)];
        } else {
          arr.push(child);
        }
      });

      return arr;
    }

    function removeEmpties(el) {
      Array.from(el.childNodes).forEach(child => {
        if (child.childNodes.length) removeEmpties(child);
        if (child.nodeName !== '#text' && !child.innerHTML.length) child.remove();
      });
    }
  }
  function processEmpty() {
    q.newDiv = '';
    el.innerHTML = '';
    processLine({line: 1}); // This will stop the main iterator & run 'processq'.
  }
  function processRun(item) {
    clearInterval(q.type); // Stop the main iterator.

    item.run(el);
    q.item++;
    processq();
  }
  function processEnd() {
    clearInterval(q.type); // Final stop to our main iterator.
    q.cb(); // Run the callback provided.
  }

  // The kill switch.
  q.kill = function(e) {
    document.body.removeEventListener(e.type, q.kill);
    q.killed = true; // For processListen.

    // Stop all iterations & pauses.
    clearInterval(q.iterator); // From processMsg.
    clearInterval(q.goBack); // From processBack.
    clearTimeout(q.pause) // From processPause.

    if (q.item === q.length) return console.log('This typer has completed; removing listener.');

    // If typer is in a listener state...
    let ear = q[q.item];
    if (ear && ear.listen) {
      let el = document.querySelector(ear.el);
      el.dispatchEvent(new Event(ear.listen));
    }
  }

  // Return 'typerObj' to be able to run the various methods.
  return typerObj;
}