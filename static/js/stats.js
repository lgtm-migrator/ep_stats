if (typeof exports === 'undefined') {
  var exports = this.mymodule = {};
}

exports.stats = {
  init() {
    stats.update();
  },
  show() {
    $('#stats').show();
    $('#stats').css('top', `${$('#editorcontainer').offset().top}px`);
    //    $('#options-stickychat').attr("checked","checked");
    exports.stats.update();
  },
  hide() {
    $('#stats').hide();
  },
  update() {
    const html = $('iframe[name="ace_outer"]').contents().find('iframe').contents().find('#innerdocbody').html();
    const text = $('iframe[name="ace_outer"]').contents().find('iframe').contents().find('#innerdocbody').text();
    $('#length > .stats').html(text.replace(/\s/g, '').length);
    $('#lengthWhitespace > .stats').html(text.length);
    $('#wordCount > .stats').html(exports.wordCount());
    $('#revCount > .stats').html(pad.getCollabRevisionNumber());
    $('#savedRevCount > .stats').html(clientVars.savedRevisions.length); // TODO cake doesnt update in real time
    $('#authorCount > .stats').html(Object.keys(clientVars.collab_client_vars.historicalAuthorData).length);
    $('#wordsContributed > .stats').html(tb(exports.stats.authors.numberOfWords()));
    $('#linesContributed > .stats').html(tb(exports.stats.authors.numberOfLines()));
    $('#linesAsOnlyContributor > .stats').html(tb(exports.stats.authors.numberOfLinesExclusive()));
    $('#numberOfCharsIncWS > .stats').html(tb(exports.stats.authors.numberOfChars()));
    $('#numberOfCharsExcWS > .stats').html(tb(exports.stats.authors.numberOfCharsExcWS()));
  },
};


exports.wordCount = function () {
  let totalCount = 0;
  $('iframe[name="ace_outer"]').contents().find('iframe').contents().find('#innerdocbody').contents().each(function () {
    let lineCount = 0;
    $(this).contents().each(function () {
      let numberOf = $(this).text().split(' ');
      numberOf = arrayDelete(numberOf, ''); // dont include spaces or line breaks or other nastyness
      lineCount += numberOf.length;
    });
    totalCount += lineCount;
  });
  return totalCount;
};

exports.stats.authors = {
  numberOfWords() {
    const results = {};
    // go through each word, does it have the class of this author?
    // output format.  John -- 6, Dave -- 9
    $('iframe[name="ace_outer"]').contents().find('iframe').contents().find('#innerdocbody').contents().each(function () {
      $(this).contents().each(function () {
        const line = this;
        let classes = $(this).attr('class');
        if (classes) {
          classes = classes.split(' ');
          $.each(classes, (k, spanClass) => {
            if (spanClass.indexOf('author') !== -1) { // if an author class exists on this span
              // how many words are in this string?
              const number = $(line).text().split(' ').length;
              if (!results[spanClass]) {
                results[spanClass] = number;
              } else {
                results[spanClass] = results[spanClass] + number;
              }
            }
          });
        }
      });
    });
    return results;
  },
  numberOfLines() {
    const results = {};
    // output format.  John -- 2, Dave -- 3
    $('iframe[name="ace_outer"]').contents().find('iframe').contents().find('#innerdocbody').contents().each(function () { // each line
      $(this).contents().each(function () {
        const line = this;
        let classes = $(this).attr('class');
        if (classes) {
          classes = classes.split(' ');
          $.each(classes, (k, spanClass) => {
            if (spanClass.indexOf('author') !== -1) { // if an author class exists on this span
              // how many words are in this string?
              const number = $(line).text().split(' ').length;
              if (!results[spanClass]) {
                results[spanClass] = 1;
              } else {
                results[spanClass] = results[spanClass] + 1;
              }
            }
          });
        }
      });
    });
    return results;
  },
  numberOfLinesExclusive() {
    const results = {};
    let lineCount = 1;
    // output format.  John -- 1, Dave -- 1
    $('iframe[name="ace_outer"]').contents().find('iframe').contents().find('#innerdocbody').contents().each(function () { // For Each LINE
      const line = {};
      $(this).contents().each(function () { // For SPAN!
        let classes = $(this).attr('class');
        if (classes) {
          classes = classes.split(' ');
          $.each(classes, (k, spanClass) => {
            if (spanClass.indexOf('author') !== -1) { // if an author class exists on this span
              if (!line[lineCount]) {
                line[lineCount] = {};
                line[lineCount].author = spanClass; // first author!
              } else {
                delete line[lineCount];// already has an author so nuke!
              }
            }
          });
        }
        // End Span
      });
      const lineHasOneAuthor = (line[lineCount]);
      if (lineHasOneAuthor) {
        // add author to results obj
        const author = line[lineCount].author;
        results[author] = (results[author] + 1) || 1;
      }
      lineCount++;
      // End Line
    });
    return results;
  },
  numberOfChars() {
    const results = {};
    // output format.  John -- 6, Dave -- 9
    $('iframe[name="ace_outer"]').contents().find('iframe').contents().find('#innerdocbody').contents().each(function () {
      $(this).contents().each(function () {
        let classes = $(this).attr('class');
        if (classes) {
          classes = classes.split(' ');
          const number = $(this).text().length;
          $.each(classes, (k, spanClass) => {
            if (spanClass.indexOf('author') !== -1) { // if an author class exists on this span
              results[spanClass] = number;
            } else {
              results[spanClass] = results[spanClass] + 1;
            }
          });
        }
      });
    });
    return results;
  },
  numberOfCharsExcWS() {
    const results = {};
    // output format.  John -- 6, Dave -- 9
    $('iframe[name="ace_outer"]').contents().find('iframe').contents().find('#innerdocbody').contents().each(function () {
      $(this).contents().each(function () {
        let classes = $(this).attr('class');
        if (classes) {
          classes = classes.split(' ');
          const number = $(this).text().replace(/\s/g, '').length; // get length without whitespace
          $.each(classes, (k, spanClass) => {
            if (classes.indexOf('author') !== -1) { // if an author class exists on this span
              results[spanClass] = number;
            } else {
              results[spanClass] = results[spanClass] + number;
            }
          });
        }
      });
    });
    return results;
  },
};

exports.postAceInit = function (hook, context) {
  stats = exports.stats;

  /* on click */
  $('#options-stats').on('click', () => {
    if ($('#options-stats').is(':checked')) {
      stats.show();
    } else {
      stats.hide();
    }
  });
};

exports.aceEditEvent = function (hook_name, event, cb) {
  if ($('#options-stats').is(':checked')) { // if stats are enabled
    if (event.callstack.docTextChanged && event.callstack.domClean) {
      exports.stats.update();
    }
  }
};

exports.className2Author = function (className) {
  return className.substring(7).replace(/[a-y0-9]+|-|z.+?z/g, (cc) => {
    if (cc == '-') { return '.'; } else if (cc.charAt(0) == 'z') {
      return String.fromCharCode(Number(cc.slice(1, -1)));
    } else {
      return cc;
    }
  });
};

exports.getAuthorClassName = function (author) {
  return `ep_cursortrace-${author.replace(/[^a-y0-9]/g, (c) => {
    if (c == '.') return '-';
    return `z${c.charCodeAt(0)}z`;
  })}`;
};

function tb(data) { // turns data object into a table
  let table = '<table>';
  for (const value in data) {
    table += `<tr><td class='statsAuthorColor' style='background-color:${authorColorFromClass(value)}'></td><td>${authorNameFromClass(value)}:</td><td>${data[value]}</td></tr>`;
  }
  table += '</table>';
  return table;
}

function authorNameFromClass(authorClass) { // turn authorClass into authorID then authorname..
  // get the authorID from the class..
  const authorId = exports.className2Author(authorClass);

  // It could always be me..
  const myAuthorId = pad.myUserInfo.userId;
  if (myAuthorId == authorId) {
    return 'Me';
  }

  // Not me, let's look up in the DOM
  let name = null;
  $('#otheruserstable > tbody > tr').each(function () {
    if (authorId == $(this).data('authorid')) {
      $(this).find('.usertdname').each(function () {
        name = $(this).text();
      });
    }
  });
  if (name) return name;

  // Else go historical
  const historical = clientVars.collab_client_vars.historicalAuthorData[authorId];
  return (historical && historical.name) || 'Unknown Author';
}

function authorColorFromClass(authorClass) { // turn authorClass into authorID then authorname..
  // get the authorID from the class..
  const authorId = exports.className2Author(authorClass);

  // It could always be me..
  const myAuthorId = pad.myUserInfo.userId;
  if (myAuthorId == authorId) {
    return '#fff';
  }

  // Not me, let's look up in the DOM
  let color = null;
  $('#otheruserstable > tbody > tr').each(function () {
    if (authorId == $(this).data('authorid')) {
      $(this).find('.usertdswatch > div').each(function () {
        color = $(this).css('background-color');
      });
    }
  });
  if (color) return color;

  // Else go historical
  const historical = clientVars.collab_client_vars.historicalAuthorData[authorId];
  return (historical && historical.color) || '#fff';
}


function arrayDelete(array, deleteValue) {
  for (let i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
}
