const ID3Writer = require('browser-id3-writer')
const Jszip = require('jszip')
require('file-saver');
let album;
const container = document.getElementById('container');
const hot = new Handsontable(container, {
  rowHeaders: true,
  colHeaders: true
});
document.getElementById('dauso').addEventListener('click', (event) => {
  if (typeof a === 'number') {
    //気が向いたら一つずつダウンロードさせるようにするかも
  } else if (typeof a === 'undefined') {
    const schema = Object.getOwnPropertyNames(hot.getSchema())
    const zip = new Jszip()
    const salvi = []

    function salvo(i) { //なんでsaveはラテン語でloadはゲルマン語なんだ
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(album[i]);
        reader.onload = function () {
          const arrayBuffer = reader.result;
          const data = hot.getData()
          const writer = new ID3Writer(arrayBuffer);
          for (j = 1; j < schema.length; j++) {
            if (schema[j] == 'TPE1') {
              writer.setFrame(schema[j], [data[i][j]])
            } else {
              writer.setFrame(schema[j], data[i][j])
            }
          }
          writer.addTag();
          const taggedSongBuffer = writer.arrayBuffer;
          zip.file(data[i][0], taggedSongBuffer);
          resolve()
        };
        reader.onerror = function () {
          // handle error
          console.error('Reader error', reader.error);
        };
      })
    }
    for (let i = 0; i < album.length; i++) {
      salvi.push(salvo(i))
    }
    Promise.all(salvi).then(() => {
      zip.generateAsync({
        type: "blob"
      }).then(function (content) {
        saveAs(content, "example.zip");
      });
    })
  }
})
document.getElementById('file').addEventListener('change', (event) => {
  if (event.target.files.length === 0) {
    return;
  }
  album = event.target.files
  const data = [
    ['ファイル名'],
  ];
  const ladungen = [] //loadってゲルマン語だったのか
  function laden(file, i) {
    return new Promise((resolve, reject) => {
      ID3.loadTags(i, () => {
        const tags = ID3.getAllTags(i);
        data.push({
          ファイル名: file.name
        })
        for (tag in tags) {
          if (typeof tags[tag] === 'object' && tag !== 'flags') { //タグだけの取り出し
            if (data[0].indexOf(tags[tag].id) === -1) data[0].push(tags[tag].id)
          }
        }
        data[0].forEach(tag => {
          if (tags[tag]) data[data.length - 1][tag] = tags[tag].data
        })
        resolve()
      }, {
        dataReader: ID3.FileAPIReader(file)
      });
    })
  }
  for (let i = 0; i < album.length; i++) {
    const file = album[i]
    ladungen.push(laden(file, i))
  }
  Promise.all(ladungen).then(() => {
    const obj = {}
    data[0].forEach(tag => {
      obj[tag] = null
    })
    hot.updateSettings({
      colHeaders: data[0],
      dataSchema: obj
    })
    hot.loadData(data.slice(1))
    hot.getSchema()
  })
});
