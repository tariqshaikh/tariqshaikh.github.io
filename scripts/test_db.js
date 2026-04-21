const admin = require('firebase-admin');
admin.initializeApp({
  projectId: "ais-dev-dkftspfq4ht2uqq7i32svb"
});
const db = admin.firestore();

async function run() {
  const q = await db.collection('users').doc('1jBw5r1hM3S9y2X6m2jA4M0s2Jm1').collection('statementUploads').limit(1).get()
  q.forEach(d => console.log(Object.keys(d.data())));
  
  const q2 = await db.collection('users').doc('1jBw5r1hM3S9y2X6m2jA4M0s2Jm1').collection('uploads').limit(1).get()
  q2.forEach(d => console.log(Object.keys(d.data())));
  
  const q3 = await db.collection('users').doc('1jBw5r1hM3S9y2X6m2jA4M0s2Jm1').collection('statementUploadHistory').limit(1).get()
  q3.forEach(d => console.log(Object.keys(d.data())));
}
run();
