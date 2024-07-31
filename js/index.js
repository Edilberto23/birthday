window.requestAnimFrame = function () {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
}();

// Al cargar la ventana
window.onload = function () {
  // Obtener el elemento con el id "merrywrap"
  var merrywrap = document.getElementById("merrywrap");
  // Obtener el primer elemento con la clase "giftbox" dentro de "merrywrap"
  var box = merrywrap.getElementsByClassName("giftbox")[0];
  // Inicializar la variable "step" en 1
  var step = 1;
  // Array que contiene los tiempos de espera en milisegundos para cada paso
  var stepMinutes = [2000, 2000, 1000, 1000];

  // Función para inicializar el evento de clic en la "giftbox"
  function init() {
    box.addEventListener("click", openBox, false);
  }

  // Función para cambiar la clase del elemento "merrywrap" según el paso actual
  function stepClass(step) {
    merrywrap.className = 'merrywrap';
    merrywrap.className = 'merrywrap step-' + step;
  }

  // Función para manejar la apertura de la "giftbox"
  function openBox() {
    // Si estamos en el paso 1, remover el evento de clic en la "giftbox"
    if (step === 1) {
      box.removeEventListener("click", openBox, false);
    }
    // Cambiar la clase del elemento "merrywrap" al paso actual
    stepClass(step);
    // Si estamos en el paso 3, no hacer nada (aquí se podría agregar lógica adicional)
    if (step === 3) {
    }
    // Si estamos en el paso 4, revelar el contenido y terminar
    if (step === 4) {
      // Redirigir a la nueva página
      window.location.href = "hd.html";
      return;
    }
    // Configurar un temporizador para llamar a "openBox" después de un tiempo especificado
    setTimeout(openBox, stepMinutes[step - 1]);
    // Incrementar el paso
    step++;
  }

  // Inicializar el evento de clic
  init();
};

// Función para revelar el contenido final
function reveal() {
  // Cambiar el color de fondo del elemento "merrywrap" a transparente
  document.querySelector('.merrywrap').style.backgroundColor = 'transparent';

  // Llamar a la función "loop" para iniciar el bucle de animación
  loop();

  // Variables para el ancho y alto del iframe
  var w, h;
  if (window.innerWidth >= 1000) {
    w = 295; h = 185;
  } else {
    w = 255; h = 155;
  }

  // Crear un elemento iframe y configurar sus atributos
  var ifrm = document.createElement("iframe");
  ifrm.setAttribute("src", "https://www.youtube.com/embed/gbICivOO26U?controls=0&loop=1&autoplay=1");
  ifrm.style.border = 'none';
  // Agregar el iframe al elemento con id "video"
  document.querySelector('#video').appendChild(ifrm);
}
