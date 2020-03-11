const functions = require('firebase-functions');
const admin = require('firebase-admin')
const express = require('express')
const cros = require('cors');

const app = express();
app.use(cros({origin: true}));

admin.initializeApp(functions.config().firebase);
const firestore = admin.firestore();
const articlesRef = firestore.collection('articles');

// 記事取得
app.get('/article/id/:id',(req,resp) => {
    const { id } = req.params;
    articlesRef.doc(id).get().then((doc) => {
        let result = doc.data();
        result['id'] = doc.id;
        result.insert_date = result.insert_date.toDate();
        result.update_date = result.update_date.toDate();
        result.insert_id = '';
        result.update_id = '';
        resp.send(result);
        const view = result.view + 1
        articlesRef.doc(id).update({
            view: view
        })
    });
    return;
})

// 日付で検索
app.get('/articles/field/:field/sort/:sort/limit/:limit',(req,res) => {
    const { field, sort, limit} = req.params;
    articlesRef.orderBy(field,sort).limit(Number(limit)).get().then((docs) => {
        let results = []
        docs.forEach((doc) => {
            let result = doc.data();
            result['id'] = doc.id;
            result.insert_date = result.insert_date.toDate();
            result.update_date = result.update_date.toDate();
            if(!doc.data().is_delete){
                results.push(result);
            }
        });
        res.send(results);
    });
    return;
});

// 人気順
app.get('/articles/views/:limit',(req,res) => {
    const { limit } = req.params;
    articlesRef.orderBy('view','desc').limit(Number(limit)).get().then((docs) => {
        let results = []
        docs.forEach((doc) => {
            let result = doc.data();
            result['id'] = doc.id;
            result.insert_date = result.insert_date.toDate();
            result.update_date = result.update_date.toDate();
            if(!doc.data().is_delete){
                results.push(result);
            }
        });
        res.send(results);
    });
    return;
})

// キーワード検索
app.get('/articles/search/:keyword',(req,resp) => {
    const { keyword } = req.params;
    articlesRef.where('is_delete', '==', false).get().then((docs) => {
        let results = [];
        docs.forEach((doc) => {
            if(doc.data().body.indexOf(keyword) !== -1){
                let result = doc.data();
                result['id'] = doc.id;
                result.insert_date = result.insert_date.toDate();
                result.update_date = result.update_date.toDate();
                results.push(result);
            }
        })
        resp.send(results);
    });
    return;
});
app.get('/articles/search/',(req,resp) => {
    articlesRef.where('is_delete', '==', false).get().then((docs) => {
        let results = [];
        docs.forEach((doc) => {
            let result = doc.data();
            result['id'] = doc.id;
            result.insert_date = result.insert_date.toDate();
            result.update_date = result.update_date.toDate();
            results.push(result);
        })
        resp.send(results);
    });
    return;
});

// タグ検索
app.get('/articles/genre/:tag',(req,resp) => {
    const { tag } = req.params;
    articlesRef.where('genre', 'array-contains', tag).where('is_delete', '==', false).get().then((docs) => {
        let results = [];
        docs.forEach((doc) => {
            let result = doc.data();
            result['id'] = doc.id;
            result.insert_date = result.insert_date.toDate();
            result.update_date = result.update_date.toDate();
            results.push(result);
        });
        resp.send(results);
    });
    return;
});

// タグ一覧
app.get('/genres',(req,resp) => {
    let genres = new Set();
    articlesRef.where('is_delete', '==', false).get().then((docs) => {
        docs.forEach((doc) => {
            doc.data().genre.forEach((genre) => {
                genres.add(genre);
            });
        });
        genres = Array.from(genres.values());
        resp.send(genres);
    })
})

// 新規投稿
app.post('/article',(req,resp) => {
    const {title, genre, summary, body, insert_id, update_id, is_delete} = req.body;
    articlesRef.add({
        title: title,
        genre: genre,
        summary: summary,
        body: body,
        insert_id: insert_id,
        insert_date: new Date(),
        update_id: update_id,
        update_date: new Date(),
        is_delete: is_delete,
        version: 0,
        view: 0
    }).then((doc) => {
        const id = doc.id;
        resp.send(id);
    });
    return;
});

// 画像URLの更新
app.put('/article/imageurl',(req,resp) => {
    const { id, url } = req.body;
    articlesRef.doc(id).update({
        image: url
    }).then((doc) => {
        resp.send(doc);
    });
    return;
});

// 記事の編集
app.put('/article',(req,resp) => {
    const { id, title, genre, summary, body, update_id} = req.body;
    articlesRef.doc(id).update({
        title: title,
        genre: genre,
        summary: summary,
        body: body,
        update_date: new Date(),
        update_id: update_id
    }).then((doc) => {
        const id = doc.id;
        resp.send(id);
    });
    return;
})

exports.blogApi = functions.https.onRequest(app);