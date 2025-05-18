// Archivo: mvc/modelo/apiGraphQL.js
// Define el endpoint GraphQL relativo al dominio actual
const ENDPOINT = window.location.origin + "/graphql";

/**
 * Ejecuta una consulta GraphQL contra el endpoint configurado.
 * @param {string} query - Consulta o mutation GraphQL.
 * @param {Object} variables - Variables para la consulta.
 * @returns {Promise<Object>} - Resultado JSON de la petición.
 */
export async function gql(query, variables = {}) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (result.errors) {
    console.error("GraphQL errors:", result.errors);
    throw new Error("Error en la respuesta GraphQL");
  }

  return result.data;
}
