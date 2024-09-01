var express = require('express');
var path = require('path');
var app = express();

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'  // 데이터베이스 파일 경로
});

// 마커 모델 정의
const Marker = sequelize.define('Marker', {
  lat: {
    type: DataTypes.REAL,
    allowNull: false
  },
  lng: {
    type: DataTypes.REAL,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

// 데이터베이스와 모델 동기화
(async () => {
  await Marker.sync();
})();

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// 정적 파일 제공 설정 (public 폴더)
app.use(express.static(path.join(__dirname, 'public')));

// 마커 추가 API
app.post('/addMarker', async (req, res) => {
  console.log("Received data:", req.body);  // 요청 데이터 로그 추가
    const { lat, lng, description } = req.body;
    try {
        const marker = await Marker.create({ lat, lng, description });
        res.json({ id: marker.id });
    } catch (error) {
        console.error("Error saving marker:", error);  // 에러 로그 추가
        res.status(500).json({ error: error.message });
    }
});



// 마커 가져오기 API
app.get('/getMarkers', async (req, res) => {
    try {
        const markers = await Marker.findAll();
        res.json({ markers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 마커 삭제 API
app.post('/deleteMarker', async (req, res) => {
    const { id } = req.body;
    try {
        const result = await Marker.destroy({ where: { id } });
        if (result) {
            res.json({ deleted: true });
        } else {
            res.status(404).json({ error: 'Marker not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
