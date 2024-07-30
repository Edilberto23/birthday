window.requestAnimFrame = function () {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
}();

// ahora configuramos nuestras variables básicas para la demostración
var canvas = document.getElementById('canvas'),
  ctx = canvas.getContext('2d'),
  // dimensiones de pantalla completa
  cw = window.innerWidth,
  ch = window.innerHeight,
  // colección de fuegos artificiales
  fireworks = [],
  // colección de partículas
  particles = [],
  // tono inicial
  hue = 120,
  // al lanzar fuegos artificiales con un clic, demasiados se lanzan a la vez sin un limitador, un lanzamiento cada 5 ciclos de bucle
  limiterTotal = 5,
  limiterTick = 0,
  // esto cronometrará los lanzamientos automáticos de fuegos artificiales, un lanzamiento cada 80 ciclos de bucle
  timerTotal = 80,
  timerTick = 0,
  mousedown = false,
  // coordenada x del mouse,
  mx,
  // coordenada y del mouse
  my;

// establecer dimensiones del canvas
canvas.width = cw;
canvas.height = ch;

// ahora vamos a configurar nuestros marcadores de posición para las funciones de toda la demostración

// obtener un número aleatorio dentro de un rango
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// calcular la distancia entre dos puntos
function calculateDistance(p1x, p1y, p2x, p2y) {
  var xDistance = p1x - p2x,
    yDistance = p1y - p2y;
  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

// crear fuego artificial
function Firework(sx, sy, tx, ty) {
  // coordenadas actuales
  this.x = sx;
  this.y = sy;
  // coordenadas de inicio
  this.sx = sx;
  this.sy = sy;
  // coordenadas de destino
  this.tx = tx;
  this.ty = ty;
  // distancia desde el punto de inicio hasta el destino
  this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
  this.distanceTraveled = 0;
  // rastrear las coordenadas pasadas de cada fuego artificial para crear un efecto de rastro, aumentar el recuento de coordenadas para crear rastros más prominentes
  this.coordinates = [];
  this.coordinateCount = 3;
  // llenar la colección inicial de coordenadas con las coordenadas actuales
  while (this.coordinateCount--) {
    this.coordinates.push([this.x, this.y]);
  }
  this.angle = Math.atan2(ty - sy, tx - sx);
  this.speed = 2;
  this.acceleration = 1.05;
  this.brightness = random(50, 70);
  // radio del indicador de destino circular
  this.targetRadius = 1;
}

// actualizar fuego artificial
Firework.prototype.update = function (index) {
  // eliminar el último elemento en el array de coordenadas
  this.coordinates.pop();
  // agregar las coordenadas actuales al inicio del array
  this.coordinates.unshift([this.x, this.y]);

  // ciclar el radio del indicador de destino circular
  if (this.targetRadius < 8) {
    this.targetRadius += 0.3;
  } else {
    this.targetRadius = 1;
  }

  // acelerar el fuego artificial
  this.speed *= this.acceleration;

  // obtener las velocidades actuales basadas en el ángulo y la velocidad
  var vx = Math.cos(this.angle) * this.speed,
    vy = Math.sin(this.angle) * this.speed;
  // ¿qué tan lejos habrá viajado el fuego artificial con las velocidades aplicadas?
  this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);

  // si la distancia recorrida, incluidas las velocidades, es mayor que la distancia inicial hasta el destino, entonces se ha alcanzado el destino
  if (this.distanceTraveled >= this.distanceToTarget) {
    createParticles(this.tx, this.ty);
    // eliminar el fuego artificial, usar el índice pasado en la función de actualización para determinar cuál eliminar
    fireworks.splice(index, 1);
  } else {
    // destino no alcanzado, seguir viajando
    this.x += vx;
    this.y += vy;
  }
};

// dibujar fuego artificial
Firework.prototype.draw = function () {
  ctx.beginPath();
  // moverse a la última coordenada rastreada en el conjunto, luego dibujar una línea hasta las coordenadas actuales x e y
  ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
  ctx.lineTo(this.x, this.y);
  ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + this.brightness + '%)';
  ctx.stroke();

  ctx.beginPath();
  // dibujar el destino de este fuego artificial con un círculo pulsante
  ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
  ctx.stroke();
};

// crear partícula
function Particle(x, y) {
  this.x = x;
  this.y = y;
  // rastrear las coordenadas pasadas de cada partícula para crear un efecto de rastro, aumentar el recuento de coordenadas para crear rastros más prominentes
  this.coordinates = [];
  this.coordinateCount = 5;
  while (this.coordinateCount--) {
    this.coordinates.push([this.x, this.y]);
  }
  // establecer un ángulo aleatorio en todas las direcciones posibles, en radianes
  this.angle = random(0, Math.PI * 2);
  this.speed = random(1, 10);
  // la fricción ralentizará la partícula
  this.friction = 0.95;
  // se aplicará la gravedad y tirará de la partícula hacia abajo
  this.gravity = 1;
  // establecer el tono a un número aleatorio +-20 del tono general
  this.hue = random(hue - 20, hue + 20);
  this.brightness = random(50, 80);
  this.alpha = 1;
  // establecer la velocidad a la que la partícula se desvanece
  this.decay = random(0.015, 0.03);
}

// actualizar partícula
Particle.prototype.update = function (index) {
  // eliminar el último elemento en el array de coordenadas
  this.coordinates.pop();
  // agregar las coordenadas actuales al inicio del array
  this.coordinates.unshift([this.x, this.y]);
  // ralentizar la partícula
  this.speed *= this.friction;
  // aplicar velocidad
  this.x += Math.cos(this.angle) * this.speed;
  this.y += Math.sin(this.angle) * this.speed + this.gravity;
  // desvanecer la partícula
  this.alpha -= this.decay;

  // eliminar la partícula una vez que el alfa sea lo suficientemente bajo, basado en el índice pasado
  if (this.alpha <= this.decay) {
    particles.splice(index, 1);
  }
};

// dibujar partícula
Particle.prototype.draw = function () {
  ctx.beginPath();
  // moverse a las últimas coordenadas rastreadas en el conjunto, luego dibujar una línea hasta las coordenadas actuales x e y
  ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
  ctx.lineTo(this.x, this.y);
  ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + this.alpha + ')';
  ctx.stroke();
};

// crear grupo/explosión de partículas
function createParticles(x, y) {
  // aumentar el recuento de partículas para una explosión más grande, ten en cuenta el impacto en el rendimiento del canvas con las partículas aumentadas
  var particleCount = 30;
  while (particleCount--) {
    particles.push(new Particle(x, y));
  }
}

// bucle principal de la demostración
function loop() {
  // esta función se ejecutará infinitamente con requestAnimationFrame
  requestAnimFrame(loop);

  // aumentar el tono para obtener fuegos artificiales de diferentes colores con el tiempo
  hue += 0.5;

  // normalmente, se usaría clearRect() para limpiar el canvas
  // queremos crear un efecto de rastro
  // configurar la operación compuesta en destination-out nos permitirá limpiar el canvas a una opacidad específica, en lugar de borrarlo completamente
  ctx.globalCompositeOperation = 'destination-out';
  // disminuir la propiedad alfa para crear rastros más prominentes
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, cw, ch);
  // cambiar la operación compuesta de nuevo a nuestro modo principal
  // lighter crea puntos de resaltado brillantes a medida que los fuegos artificiales y las partículas se superponen
  ctx.globalCompositeOperation = 'lighter';

  // recorrer cada fuego artificial, dibujarlo, actualizarlo
  var i = fireworks.length;
  while (i--) {
    fireworks[i].draw();
    fireworks[i].update(i);
  }

  // recorrer cada partícula, dibujarla, actualizarla
  var i = particles.length;
  while (i--) {
    particles[i].draw();
    particles[i].update(i);
  }

  // lanzar fuegos artificiales automáticamente a coordenadas aleatorias, cuando el mouse no esté presionado
  if (timerTick >= timerTotal) {
    if (!mousedown) {
      // iniciar el fuego artificial en la parte inferior central de la pantalla, luego establecer las coordenadas de destino aleatorias, las coordenadas y aleatorias se establecerán dentro del rango de la mitad superior de la pantalla
      fireworks.push(new Firework(cw / 2, ch, random(0, cw), random(0, ch / 2)));
      timerTick = 0;
    }
  } else {
    timerTick++;
  }

  // limitar la velocidad a la que se lanzan fuegos artificiales cuando el mouse está presionado
  if (limiterTick >= limiterTotal) {
    if (mousedown) {
      // iniciar el fuego artificial en la parte inferior central de la pantalla, luego establecer las coordenadas actuales del mouse como el destino
      fireworks.push(new Firework(cw / 2, ch, mx, my));
      limiterTick = 0;
    }
  } else {
    limiterTick++;
  }
}

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
