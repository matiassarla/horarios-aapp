let ultimoHorario = null;
let ultimoEstudiante = "";

const HORAS_TURNO = [
  "08:00-08:40",
  "08:40-09:20",
  "09:20-09:35", // Merienda
  "09:35-10:15",
  "10:15-10:55",
  "11:00-11:40",
  "11:40-12:20"
];


// Base de datos de materias a modo de ejemplo (puede venir de JSON externo después)
const data = { materias: [] };
const urlAPI = "https://script.google.com/macros/s/AKfycbwyocxF5Vd8BMHRDn8MbSlvcXF4q1hkFK6xRGgOYTMFVkgpkI5IVlIC6DNJDB-IGDk6/exec";

let indiceActivo = -1;

// 1️⃣ función que carga checkboxes
function cargarMaterias() {
  const cont = document.getElementById("listaMaterias");
  cont.innerHTML = "";

  data.materias.forEach((m, i) => {
    cont.innerHTML += `
      <div>
        <input type="checkbox" id="m${i}" value="${m.nombre}">
        <label for="m${i}">${m.nombre} (${m.docente})</label>
      </div>
    `;
  });
}

fetch(urlAPI)
  .then(res => res.json())
  .then(materias => {
    data.materias = materias;
    cargarMaterias();
  });

// Ocultar caja de resultados hasta que se genere horario
document.getElementById("resultado").style.display = "none";

// // Cuando haya un resultado, mostrar la caja
// const observer = new MutationObserver(() => {
//   const resultado = document.getElementById("resultado");
//   if (resultado.innerHTML.trim() !== "") {
//     resultado.style.display = "block";
//   }
// });
// observer.observe(document.getElementById("resultado"), { childList: true, subtree: true });

// Generar horario
function generarHorario() {
  const estudiante = document.getElementById("estudiante").value.trim();
  const seleccionadas = Array.from(document.querySelectorAll("#listaMaterias input:checked"))
                             .map(chk => chk.value);

  const resultado = document.getElementById("resultado");

  if (!estudiante) {
    resultado.textContent = "Por favor, ingresa el nombre del estudiante.";
    return;
  }

  if (seleccionadas.length === 0) {
    resultado.textContent = "Selecciona al menos una asignatura.";
    return;
  }

  const materiasSel = data.materias.filter(m => seleccionadas.includes(m.nombre));

  // Detectar choques
  const mapaHorarios = {};
  let choques = [];

  materiasSel.forEach(mat => {
    mat.horarios.forEach(h => {
      if (!mapaHorarios[h]) mapaHorarios[h] = [];
      mapaHorarios[h].push(mat.nombre);
    });
  });

  Object.keys(mapaHorarios).forEach(h => {
    if (mapaHorarios[h].length > 1) {
      choques.push({ horario: h, materias: mapaHorarios[h] });
    }
  });

  if (choques.length > 0) {
    const listaChoques = choques
      .map(c => `${c.materias.join(" y ")} comparten el horario ${c.horario}`)
      .join("; ");

    resultado.textContent =
      `No es posible que ${estudiante} curse todas las asignaturas seleccionadas ya que ${listaChoques}.`;
    return;
  }

  // Si no hay choques → mostrar horario
  let html = `<h3>Horario de ${estudiante}</h3>`;
  materiasSel.forEach(m => {
    html += `<p><strong>${m.nombre}</strong>: ${m.horarios.join(", ")}</p>`;
  });

  resultado.innerHTML = html;

const horarioFinal = materiasSel.flatMap(m =>
  m.horarios.map(h => ({
    materia: m.nombre,
    docente: m.docente,
    horario: h
  }))
);

console.log("Horario final:", horarioFinal);
mostrarHorarioEstudiante(horarioFinal, estudiante);
ultimoHorario = horarioFinal;
ultimoEstudiante = estudiante;

// Mostrar botón guardar
document.getElementById("guardarHorario").style.display = "inline-block";
}

// Limpiar datos
function limpiar() {
  document.getElementById("estudiante").value = "";
  document.querySelectorAll("#listaMaterias input").forEach(chk => chk.checked = false);
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("resultado").style.display = "none";
  document.getElementById("guardarHorario").style.display = "none";
  document.getElementById("horario-estudiante").innerHTML = "";
}

// Deseleccionar asignaturas
function deseleccionarAsignaturas() {
  document.querySelectorAll("#listaMaterias input").forEach(chk => chk.checked = false);
  // Borrar horario generado
  // document.getElementById("resultado").innerHTML = "";
}

let listaEstudiantes = [];
const urlEstudiantes = "https://script.google.com/macros/s/AKfycbwDz5HdKZ1CB30_ltWPi1hpd-YDdqqOhDXHC1vCcSteJVCcShQWWUD-MLde_BBs5tSX4g/exec";

fetch(urlEstudiantes)
  .then(res => res.json())
  .then(data => listaEstudiantes = data);

const input = document.getElementById("estudiante");
const sugerencias = document.getElementById("sugerencias");

input.addEventListener("input", () => {
  const texto = input.value.toLowerCase();
  sugerencias.innerHTML = "";
  indiceActivo = -1;

  if (!texto) return;

  const coincidencias = listaEstudiantes.filter(n =>
    n.toLowerCase().includes(texto)
  );

  coincidencias.forEach((nombre, index) => {
    const div = document.createElement("div");
    div.textContent = nombre;

    div.addEventListener("click", () => {
      input.value = nombre;
      sugerencias.innerHTML = "";
    });

    sugerencias.appendChild(div);
  });
});


input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const primera = sugerencias.querySelector("div");
    if (primera) {
      input.value = primera.textContent;
      sugerencias.innerHTML = "";
    }
  }
});

input.addEventListener("keydown", (e) => {
  const items = sugerencias.querySelectorAll("div");

  if (!items.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    indiceActivo = (indiceActivo + 1) % items.length;
    actualizarActivo(items);
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    indiceActivo = (indiceActivo - 1 + items.length) % items.length;
    actualizarActivo(items);
  }

  if (e.key === "Enter") {
    if (indiceActivo >= 0) {
      e.preventDefault();
      input.value = items[indiceActivo].textContent;
      sugerencias.innerHTML = "";
      indiceActivo = -1;
    }
  }
});

function actualizarActivo(items) {
  items.forEach(item => item.classList.remove("activa"));
  if (indiceActivo >= 0) {
    items[indiceActivo].classList.add("activa");
  }
}

function mostrarHorarioEstudiante(horarioFinal, nombreEstudiante) {
  const contenedor = document.getElementById("horario-estudiante");
  if (!contenedor) return;

  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  const horas = HORAS_TURNO;

  const grilla = {};
  horas.forEach(h => {
    grilla[h] = {};
    dias.forEach(d => grilla[h][d] = "");
  });

  horarioFinal.forEach(item => {
  const partes = item.horario.split(" ");
  const dia = partes[0];
  const hora = partes.slice(1).join(" ").trim();

  if (!grilla[hora]) {
    console.warn("Hora no reconocida:", hora);
    return;
  }

  grilla[hora][dia] = item.materia;
});


  let html = `
<table>
  <tr class="encabezado-estudiante">
    <td colspan="${dias.length + 1}">
      Estudiante: ${nombreEstudiante}
    </td>
  </tr>
`;

  html += "<tr><th>Hora</th>";
  dias.forEach(d => html += `<th>${d}</th>`);
  html += "</tr>";

  horas.forEach(hora => {

  // 🥪 Fila especial: Merienda
  if (hora === "09:20-09:35") {
    html += `
      <tr class="merienda">
        <td>${hora}</td>
        <td colspan="${dias.length}" class="merienda-celda">
          Merienda
        </td>
      </tr>
    `;
    return;
  }

  html += `<tr><td>${hora}</td>`;
  dias.forEach(dia => {
    const materia = grilla[hora][dia];
    html += materia
      ? `<td class="materia">${materia}</td>`
      : "<td></td>";
  });
  html += "</tr>";
});


  html += "</table>";
  contenedor.innerHTML = html;
}

document.getElementById("guardarHorario").addEventListener("click", () => {
  if (!ultimoHorario || ultimoHorario.length === 0) return;

  const horariosGuardados =
    JSON.parse(localStorage.getItem("horariosEstudiantes")) || {};

  horariosGuardados[ultimoEstudiante] = ultimoHorario;

  localStorage.setItem(
    "horariosEstudiantes",
    JSON.stringify(horariosGuardados)
  );

  alert(`Horario de ${ultimoEstudiante} guardado correctamente`);
});
