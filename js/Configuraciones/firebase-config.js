// Firebase
const firebaseConfig = {
    apiKey: "xxx",
    authDomain: "xxx",
    databaseURL: "xxx",
    projectId: "xxx",
    storageBucket: "xxx",
    messagingSenderId: "xxx",
    appId: "xxx"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
window.auth = auth;
window.database = database;
const clientsRef = database.ref('clientes');
const notesRef = database.ref('notasGenerales');
const tasksRef = database.ref('tareasGenerales');
window.clientsRef = clientsRef;
window.notesRef = notesRef;
window.tasksRef = tasksRef;
