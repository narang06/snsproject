import mysql from 'mysql2';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'test1234',
    database: 'snsproject' // db 이름
});


const promisePool = pool.promise();


export default promisePool;