const express = require('express');
const cors= require('cors');
const app = express();
const models = require('./models');
const multer = require('multer');
const upload = multer({
    storage:multer.diskStorage({
        destination:function(req, file, cb){
            cb(null, 'uploads/');
        },
        filename: function(req, file, cb){
            cb(null, file.originalname);
        }
    })
})
const detectProduct = require('./helpers/detectProduct');
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());
app.use('/uploads' ,express.static('uploads'));

app.get('/banners', (req,res)=>{
    models.Banner.findAll({
        limit:2
    }).then((result)=>{
        res.send({
            banners:result
        })
    }).catch((error)=>{
        console.log(error);
        res.status(500).send('에러가 발생했습니다.',error);
    })

})

app.get("/products", (req,res) => {
    // res.send("업로드 된 상품들입니다.");
    //const query = req.query;
    models.Product.findAll({
        order : [['createdAt', 'DESC']],
        attributes:['id','name','price','createdAt','seller', 'imageUrl', 'soldout', 'type']
    })
    .then((result)=>{
        console.log(result);
        res.send({
            products:result
        })
    }).catch((error)=>{
        console.log(error);
        res.status(400).send("에러 발생");
    })

    // res.send({
    //     "products" : [{
    //             "id" : 1,
    //             "name" : "농구공",
    //             "price" : 10000,
    //             "seller" : "조던",
    //             "imageUrl" : "images/products/basketball1.jpeg"
    //         },{
    //             "id" : 2,
    //             "name" : "축구공",
    //             "price" : 50000,
    //             "seller" : "메시",
    //             "imageUrl" : "images/products/soccerball1.jpg"
    //         },{
    //             "id" : 3,
    //             "name" : "키보드",
    //             "price" : 10000,
    //             "seller" : "그랩",
    //             "imageUrl" : "images/products/keyboard1.jpg"
    //         }]
    // })
})

app.post("/products", (req, res) => {
    const body = req.body;
    const {name, description, price, seller, imageUrl} = body;
    if(!name || !description || !price || !seller || !imageUrl){
        res.status(400).send("모든 필드를 입력해주세요");
    }

    detectProduct(imageUrl, (data)=>{
        models.Product.create({
            name,
            description,
            price,
            seller,
            imageUrl,
            type
        }).then((result)=>{
            console.log("상품 생성 결과 : ",result);
            res.send({
                result,
            })
        }).catch((error)=>{
            console.log(error);
            res.status(400).send("상품 업로드에 문제가 발생했습니다.");
        })
    })
    // res.send("상품이 등록되었습니다.");

})

app.get("/products/:id/", (req, res) => {
    const params = req.params;
    const {id} = params;
    models.Product.findOne({
        where : {
            id:id
        }
    }).then((result)=>{
        console.log("PRODUCT : ", result );
        res.send({
            product:result
        })
    }).catch((error)=>{
        console.log(error );
        res.status(400).send("상품 조회에 에러가 발생했습니다.");
    })
    // res.send(`id는 ${id}입니다.`);
})


app.post('/image', upload.single('image'), (req, res) =>{
    const file = req.file;
    console.log(file);
    res.send({
        imageUrl : file.path,
    })
})

app.post('/purchase/:id', (req, res)=>{
    const {id} = req.params;
    models.Product.update({
        soldout:1
    },{
        where: {
            id
        }
    }).then((result)=>{
        res.send({result:true})
    }).catch((error)=>{
        console.error(error);
        res.status(500).send('에러가 발생했습니다.', error);
    })
})

app.get('/products/:id/recommendation', (req, res)=>{
    const {id} = req.params;
    models.Products.findOne({
        where:{
            id
        }
    }).then((product)=>{
        console.log(product);
        const type = products.type;
        models.Product.findAll({
            where:{
                type,
                id : {
                    [models.Sequelize.Op.ne]:id
                }
            }
        }).then((products)=>{
            res.send({products});
        })
        // res.send(id);
    }).catch((error)=>{
        console.error(error);
        res.status(500).send("에러가 발생 했습니다.", error);
    })
    
})

app.listen(port, () => {
    console.log("그랩의 쇼핑몰 서버가 돌아가고 있습니다.");
    models.sequelize.sync().then(()=>{
        console.log('DB 연결 성공!');
    }).catch(()=>{
        console.log(err);
        console.log('DB 연결 에러ㅠ');
        process.exit();
    })
})