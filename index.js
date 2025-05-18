// ---------------- CONFIG BÁSICA ----------------
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");

const connectDB = require("./server/config/db");
connectDB();

const Usuario = require("./server/models/Usuario");
const Voluntariado = require("./server/models/Voluntariado");

// ---------------- ESQUEMA ----------------------
const schema = buildSchema(`
  type Usuario {
    id: ID!
    nombre: String!
    correo: String!
    password: String!
    rol: String!
  }

  type Voluntariado {
    id: ID!
    titulo: String!
    usuario: Usuario!
    fecha: String!
    descripcion: String
    tipo: String!
  }

  type Query {
    obtenerUsuarios: [Usuario]
    obtenerVoluntariados: [Voluntariado]
  }

  type Mutation {
    crearUsuario(nombre:String!, correo:String!, password:String!, rol:String): Usuario
    eliminarUsuario(correo:String!): Boolean
    login(correo:String!, password:String!): Usuario
    crearVoluntariado(
      titulo:String!, usuario:String!,
      fecha:String!, descripcion:String!, tipo:String!
    ): Voluntariado
    eliminarVoluntariado(id:ID!): Boolean
  }
`);

// ---------------- RESOLVERS --------------------
const root = {
  obtenerUsuarios: async () =>
    (await Usuario.find()).map((u) => ({
      id: u._id.toString(),
      ...u.toObject(),
    })),
  crearUsuario: async ({ nombre, correo, password, rol }) => {
    if (await Usuario.exists({ correo }))
      throw new Error("Correo ya registrado");
    const doc = await Usuario.create({ nombre, correo, password, rol });
    return { id: doc._id.toString(), ...doc.toObject() };
  },
  eliminarUsuario: async ({ correo }) =>
    (await Usuario.deleteOne({ correo })).deletedCount > 0,
  login: async ({ correo, password }) => {
    const usr = await Usuario.findOne({ correo });
    if (!usr || usr.password !== password) return null;
    return {
      id: usr._id.toString(),
      nombre: usr.nombre,
      correo: usr.correo,
      rol: usr.rol,
    };
  },
  obtenerVoluntariados: async () => {
    const vol = await Voluntariado.find().populate("usuario", "nombre correo");
    return vol.map((v) => ({
      id: v.id,
      titulo: v.titulo,
      usuario: v.usuario,
      fecha: v.fecha.toISOString().slice(0, 10),
      descripcion: v.descripcion,
      tipo: v.tipo,
    }));
  },
  crearVoluntariado: async ({ titulo, usuario, fecha, descripcion, tipo }) => {
    const autor = await Usuario.findOne({ correo: usuario });
    if (!autor) throw new Error("Usuario no existe");
    const doc = await Voluntariado.create({
      titulo,
      usuario: autor._id,
      fecha,
      descripcion,
      tipo,
    });
    return { id: doc.id, titulo, usuario: autor, fecha, descripcion, tipo };
  },
  eliminarVoluntariado: async ({ id }) =>
    (await Voluntariado.deleteOne({ _id: id })).deletedCount > 0,
};

// ---------------- SERVER -----------------------
const app = express();
app.use(cors());
app.use(express.json());

// 1) Vistas estáticas: sirve html de vistas en la raíz
app.use(express.static(path.join(__dirname, "mvc", "vistas")));

// 2) Recursos específicos con mayúsculas
app.use(
  "/Controlador",
  express.static(path.join(__dirname, "mvc", "Controlador"))
);
app.use("/Modelo", express.static(path.join(__dirname, "mvc", "modelo")));
app.use("/Vistas", express.static(path.join(__dirname, "mvc", "vistas")));

// 3) Assets generales (CSS, JS comunes) desde mvc raíz
app.use(express.static(path.join(__dirname, "mvc")));

// Redirigir '/' a 'home.html'
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "mvc", "vistas", "home.html"));
});

// Endpoint GraphQL
app.use("/graphql", graphqlHTTP({ schema, rootValue: root, graphiql: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 GraphQL listo → http://localhost:${PORT}/graphql`)
);
