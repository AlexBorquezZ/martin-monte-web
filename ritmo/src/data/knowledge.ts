/**
 * Fichas de conocimiento originales, incluidas en la app (funcionan offline).
 * Criterios: datos ampliamente aceptados, sin citas textuales atribuidas y
 * señalando cuando algo es un debate o una regla práctica y no un hecho.
 */
export type KnowledgeCategory =
  | 'historia'
  | 'ciencia'
  | 'filosofia'
  | 'geografia'
  | 'economia'
  | 'arte'
  | 'psicologia'
  | 'cultura';

export const KNOWLEDGE_CATEGORIES: { id: KnowledgeCategory; label: string }[] = [
  { id: 'historia', label: 'Historia' },
  { id: 'ciencia', label: 'Ciencia' },
  { id: 'filosofia', label: 'Filosofía' },
  { id: 'geografia', label: 'Geografía' },
  { id: 'economia', label: 'Economía' },
  { id: 'arte', label: 'Arte' },
  { id: 'psicologia', label: 'Psicología' },
  { id: 'cultura', label: 'Cultura general' },
];

export interface KnowledgeCard {
  id: string;
  category: KnowledgeCategory;
  title: string;
  body: string;
  example: string;
  question: string;
  deeper: string;
}

export const KNOWLEDGE_CARDS: KnowledgeCard[] = [
  // ── Historia ──
  {
    id: 'hist-imprenta',
    category: 'historia',
    title: 'La imprenta de tipos móviles',
    body: 'Hacia 1450, en Maguncia, Johannes Gutenberg combinó tipos móviles de metal, una tinta a base de aceite y una prensa adaptada. Hubo antecedentes en Asia: en China se usaron tipos de cerámica en el siglo XI y en Corea se imprimió con tipos metálicos en el siglo XIV. Lo que cambió en Europa fue la escala: los libros se volvieron mucho más baratos y las ideas circularon más rápido.',
    example: 'Algo parecido pasa cuando una herramienta abarata compartir información: cambia quién puede aprender y opinar.',
    question: '¿Qué herramienta actual creés que está cambiando la forma en que aprendemos?',
    deeper: 'Buscá información sobre el «Jikji», un libro coreano impreso con tipos metálicos en 1377.',
  },
  {
    id: 'hist-mayo',
    category: 'historia',
    title: 'Mayo de 1810 y julio de 1816',
    body: 'El 25 de mayo de 1810, en Buenos Aires, se formó la Primera Junta, que reemplazó al virrey. Todavía no era una declaración de independencia: esa llegó el 9 de julio de 1816, en el Congreso reunido en San Miguel de Tucumán. Entre ambas fechas hubo seis años de guerras, debates y cambios de gobierno.',
    example: 'Los grandes cambios rara vez ocurren en un solo día: suelen ser procesos con muchos pasos intermedios.',
    question: '¿Qué cambio de tu vida fue, en realidad, un proceso largo?',
    deeper: 'Leé sobre las diferencias entre la Primera Junta y la Junta Grande.',
  },
  {
    id: 'hist-andes',
    category: 'historia',
    title: 'El cruce de los Andes',
    body: 'A comienzos de 1817, el Ejército de los Andes, organizado por José de San Martín en Mendoza, cruzó la cordillera por varios pasos a la vez para confundir a las fuerzas realistas. Poco después venció en la batalla de Chacabuco, en Chile. La preparación llevó años: logística, provisiones, mulas, ropa de abrigo y fabricación de armamento.',
    example: 'Como en cualquier proyecto grande, la parte menos visible —la preparación— fue decisiva.',
    question: '¿Qué proyecto tuyo necesita más preparación que esfuerzo de último momento?',
    deeper: 'Buscá un mapa de las columnas del cruce y los pasos que usaron.',
  },
  {
    id: 'hist-industrial',
    category: 'historia',
    title: 'La Revolución Industrial',
    body: 'Desde la segunda mitad del siglo XVIII, en Gran Bretaña, la producción pasó de talleres manuales a fábricas con máquinas. La máquina de vapor, mejorada por James Watt, permitió usar energía en lugares donde no había ríos. Cambió el trabajo, las ciudades, los horarios y la vida familiar, con mejoras materiales y también duras condiciones laborales.',
    example: 'Los horarios fijos de trabajo que hoy damos por naturales se difundieron con las fábricas.',
    question: '¿Qué parte de tu rutina diaria es una costumbre heredada y no una necesidad?',
    deeper: 'Investigá cómo surgió la jornada laboral de ocho horas.',
  },
  // ── Ciencia ──
  {
    id: 'cien-cielo',
    category: 'ciencia',
    title: '¿Por qué el cielo es azul?',
    body: 'La luz del Sol contiene todos los colores. Al atravesar la atmósfera, las moléculas del aire dispersan mucho más la luz de longitud de onda corta (azul y violeta) que la larga (rojo). Por eso vemos azul en todas direcciones. Nuestros ojos son menos sensibles al violeta, y parte se absorbe en la alta atmósfera. A este fenómeno se lo llama dispersión de Rayleigh.',
    example: 'Al atardecer la luz recorre más atmósfera, el azul se dispersa por el camino y llegan más los naranjas y rojos.',
    question: '¿Qué fenómeno cotidiano te gustaría entender mejor?',
    deeper: 'Buscá «dispersión de Rayleigh» y «dispersión de Mie» para entender por qué las nubes son blancas.',
  },
  {
    id: 'cien-fotosintesis',
    category: 'ciencia',
    title: 'Fotosíntesis',
    body: 'Las plantas, las algas y algunas bacterias usan la energía de la luz para transformar dióxido de carbono y agua en azúcares, liberando oxígeno. Un dato curioso: el oxígeno que liberan proviene de las moléculas de agua, no del dióxido de carbono. Gran parte del oxígeno de la atmósfera se produce en los océanos, gracias al fitoplancton.',
    example: 'Cada vez que respirás, usás oxígeno que en algún momento liberó un organismo fotosintético.',
    question: '¿Qué te gustaría cultivar o cuidar, aunque sea una planta pequeña?',
    deeper: 'Leé sobre el fitoplancton y su papel en el clima.',
  },
  {
    id: 'cien-estaciones',
    category: 'ciencia',
    title: 'Las estaciones no dependen de la distancia al Sol',
    body: 'Las estaciones se deben a la inclinación del eje terrestre (unos 23,4°). Durante parte del año, un hemisferio recibe la luz más directa y días más largos. De hecho, la Tierra está más cerca del Sol a comienzos de enero, cuando en el hemisferio sur es verano y en el norte es invierno.',
    example: 'Por eso en Argentina la Navidad cae en verano y en Europa en invierno.',
    question: '¿Qué idea que dabas por obvia resultó no ser cierta?',
    deeper: 'Buscá qué son el perihelio y el afelio.',
  },
  {
    id: 'cien-sueno',
    category: 'ciencia',
    title: 'Dormir y recordar',
    body: 'Numerosas investigaciones indican que el sueño participa en la consolidación de la memoria: después de aprender algo, dormir suele ayudar a retenerlo mejor que pasar el mismo tiempo despierto. Los mecanismos exactos todavía se estudian. No es un truco para aprender sin esfuerzo, sino una parte del proceso.',
    example: 'Repasar un tema y dormir bien antes de un examen suele rendir más que estudiar toda la noche.',
    question: '¿Cómo cuidás tu descanso cuando estás aprendiendo algo nuevo?',
    deeper: 'Buscá divulgación seria sobre «consolidación de la memoria durante el sueño».',
  },
  // ── Filosofía ──
  {
    id: 'filo-control',
    category: 'filosofia',
    title: 'Lo que depende de mí',
    body: 'Los estoicos, como Epicteto, propusieron distinguir entre lo que depende de nosotros (nuestros juicios, intenciones y acciones) y lo que no (la opinión ajena, el clima, muchos resultados). La idea no es resignarse, sino poner la energía donde realmente tiene efecto.',
    example: 'No controlás si te eligen para un trabajo, pero sí cómo preparás la entrevista.',
    question: 'De lo que hoy te preocupa, ¿qué parte depende de vos?',
    deeper: 'Leé una traducción del «Enquiridión» (Manual) de Epicteto; es breve.',
  },
  {
    id: 'filo-socrates',
    category: 'filosofia',
    title: 'El método de preguntar',
    body: 'Sócrates no dejó escritos: lo conocemos sobre todo por los diálogos de Platón. En ellos aparece examinando ideas mediante preguntas sucesivas, hasta mostrar contradicciones o supuestos ocultos. Este estilo de diálogo se conoce como método socrático y todavía se usa en educación.',
    example: 'Preguntar «¿qué querés decir con eso?» antes de discutir evita muchas peleas.',
    question: '¿Qué creencia tuya te animarías a examinar con preguntas?',
    deeper: 'Leé la «Apología de Sócrates», de Platón.',
  },
  {
    id: 'filo-ockham',
    category: 'filosofia',
    title: 'La navaja de Ockham',
    body: 'Es un principio atribuido a Guillermo de Ockham, filósofo del siglo XIV: entre explicaciones que dan cuenta igual de bien de algo, conviene preferir la que requiere menos supuestos. Es una guía práctica, no una prueba: a veces la explicación correcta es la más complicada.',
    example: 'Si el celular no carga, antes de pensar en una falla grave conviene revisar el cable.',
    question: '¿Qué situación estás complicando con explicaciones innecesarias?',
    deeper: 'Buscá ejemplos de la navaja de Ockham en la historia de la ciencia.',
  },
  {
    id: 'filo-medio',
    category: 'filosofia',
    title: 'La virtud como término medio',
    body: 'En la «Ética a Nicómaco», Aristóteles sostuvo que muchas virtudes se ubican entre dos extremos. La valentía, por ejemplo, está entre la cobardía y la temeridad. El punto medio no es una fórmula fija: depende de la persona y la situación, y se aprende con práctica.',
    example: 'Entre no hacer ejercicio nunca y entrenar hasta lastimarse hay un punto razonable para cada cuerpo.',
    question: '¿En qué área de tu vida estás yendo a un extremo?',
    deeper: 'Leé el libro II de la «Ética a Nicómaco».',
  },
  // ── Geografía ──
  {
    id: 'geo-aconcagua',
    category: 'geografia',
    title: 'El Aconcagua',
    body: 'Ubicado en la provincia de Mendoza, el Aconcagua tiene alrededor de 6.960 metros de altura y es la montaña más alta de América y del mundo fuera de Asia. Forma parte de la cordillera de los Andes y está protegido dentro de un parque provincial.',
    example: 'Quienes lo escalan dedican días a aclimatarse: subir de a poco es parte de llegar.',
    question: '¿Qué meta tuya necesita «aclimatación» antes de intentarla de lleno?',
    deeper: 'Buscá cómo se forman las montañas en zonas de subducción.',
  },
  {
    id: 'geo-amazonas',
    category: 'geografia',
    title: 'El río Amazonas',
    body: 'El Amazonas es el río con mayor caudal del planeta: vuelca al océano Atlántico más agua que cualquier otro. Sobre cuál es el más largo, si el Amazonas o el Nilo, hay debate, porque depende de dónde se ubique su naciente y de cómo se mida.',
    example: 'Una misma pregunta («¿cuál es el más largo?») puede tener respuestas distintas según el criterio.',
    question: '¿Qué discusión que tuviste dependía, en realidad, de cómo se medía algo?',
    deeper: 'Investigá dónde nace el Amazonas según distintas expediciones.',
  },
  {
    id: 'geo-placas',
    category: 'geografia',
    title: 'Los Andes y las placas tectónicas',
    body: 'La superficie terrestre está dividida en placas que se mueven unos pocos centímetros por año. En el oeste de Sudamérica, la placa de Nazca se hunde por debajo de la placa Sudamericana. Ese proceso, llamado subducción, levantó la cordillera de los Andes y explica la actividad sísmica de la región.',
    example: 'Las uñas crecen a una velocidad parecida a la de algunas placas: lento, pero constante.',
    question: '¿Qué cambio lento pero constante está ocurriendo en tu vida?',
    deeper: 'Buscá información sobre la teoría de la deriva continental de Alfred Wegener.',
  },
  {
    id: 'geo-husos',
    category: 'geografia',
    title: 'Husos horarios',
    body: 'La Tierra gira unos 15 grados por hora, por eso el mundo se divide en husos horarios. La hora oficial, sin embargo, es una decisión política: Argentina usa UTC−3 aunque, por su longitud, gran parte de su territorio correspondería a UTC−4 o UTC−5. Por eso en el oeste del país amanece y anochece «tarde» según el reloj.',
    example: 'En Mendoza, en invierno, puede seguir oscuro bien entrada la mañana.',
    question: '¿Tu horario está alineado con tu energía natural o solo con el reloj?',
    deeper: 'Investigá la historia de los cambios de huso horario en Argentina.',
  },
  // ── Economía ──
  {
    id: 'eco-compuesto',
    category: 'economia',
    title: 'Interés compuesto',
    body: 'Con interés compuesto, los intereses se suman al capital y luego también generan intereses. Con 1.000 al 10 % anual, al año hay 1.100 y al segundo año 1.210, no 1.200. Funciona a favor cuando ahorrás y en contra cuando debés. Ojo: con inflación, lo que importa es el rendimiento real, es decir, por encima de la suba de precios.',
    example: 'Una deuda de tarjeta que no se paga completa crece con la misma lógica.',
    question: '¿Hay algo que hoy esté creciendo «en compuesto» en tu vida, a favor o en contra?',
    deeper: 'Buscá la diferencia entre tasa nominal y tasa efectiva.',
  },
  {
    id: 'eco-inflacion',
    category: 'economia',
    title: 'Inflación y valor real',
    body: 'La inflación es el aumento generalizado y sostenido de los precios. Cuando ocurre, el mismo dinero compra menos. Por eso conviene distinguir valores nominales (los números en pesos) de valores reales (lo que esos pesos pueden comprar). Un aumento de sueldo del 20 % con una inflación del 30 % es, en términos reales, una pérdida.',
    example: 'Comparar cuánto gastabas en el súper hace un año sin ajustar por inflación lleva a conclusiones engañosas.',
    question: '¿Qué gasto tuyo conviene revisar en términos reales y no nominales?',
    deeper: 'Buscá cómo se calcula un índice de precios al consumidor.',
  },
  {
    id: 'eco-oportunidad',
    category: 'economia',
    title: 'Costo de oportunidad',
    body: 'Cada elección implica renunciar a la mejor alternativa que no elegiste. Ese «lo que dejás» es el costo de oportunidad. No se ve en los recibos, pero existe: aplica al dinero y también al tiempo y a la atención.',
    example: 'Una hora mirando videos sin propósito tiene el costo de oportunidad de una hora de descanso, estudio o charla.',
    question: '¿Cuál es el costo de oportunidad de tu hábito que más tiempo ocupa?',
    deeper: 'Leé sobre la diferencia entre costos explícitos e implícitos.',
  },
  {
    id: 'eco-emergencia',
    category: 'economia',
    title: 'Fondo de emergencia',
    body: 'Un fondo de emergencia es dinero separado para imprevistos: una reparación, un problema de salud, una baja de ingresos. Una referencia frecuente es juntar el equivalente a algunos meses de gastos esenciales, pero el monto adecuado depende de cada situación. Su objetivo no es rendir mucho, sino estar disponible.',
    example: 'Tener ese colchón evita endeudarse con tasas altas cuando algo se rompe.',
    question: '¿Cuánto necesitarías para cubrir un mes de gastos esenciales?',
    deeper: 'Revisá tus gastos de los últimos meses en la sección Finanzas para estimarlo.',
  },
  // ── Arte ──
  {
    id: 'arte-perspectiva',
    category: 'arte',
    title: 'La perspectiva lineal',
    body: 'A comienzos del siglo XV, en Florencia, Filippo Brunelleschi hizo experimentos para representar el espacio en una superficie plana. Poco después, Leon Battista Alberti describió el método por escrito. La idea central es el punto de fuga: las líneas paralelas parecen converger en un punto del horizonte.',
    example: 'En una foto de una ruta recta, los bordes parecen juntarse a lo lejos.',
    question: '¿Desde qué «punto de vista» estás mirando un problema actual?',
    deeper: 'Observá «La Trinidad» de Masaccio, uno de los primeros ejemplos de perspectiva.',
  },
  {
    id: 'arte-tango',
    category: 'arte',
    title: 'El tango',
    body: 'El tango surgió a fines del siglo XIX en el Río de la Plata, en Buenos Aires y Montevideo, mezclando influencias de inmigrantes europeos, ritmos afrorrioplatenses y tradiciones criollas. En 2009, la UNESCO lo inscribió en la lista del Patrimonio Cultural Inmaterial de la Humanidad.',
    example: 'Muchas expresiones cotidianas del lunfardo llegaron al habla común a través de letras de tango.',
    question: '¿Qué música te conecta con tu historia o tu familia?',
    deeper: 'Escuchá grabaciones de distintas épocas del tango y compará los estilos.',
  },
  {
    id: 'arte-impresionismo',
    category: 'arte',
    title: 'Impresionismo',
    body: 'El nombre vino de un cuadro de Claude Monet, «Impresión, sol naciente», presentado en una exposición en París en 1874. Un crítico usó el término en tono burlón y terminó dando nombre al movimiento. Los impresionistas buscaban captar la luz y el instante, muchas veces pintando al aire libre.',
    example: 'Una misma esquina se ve distinta a la mañana y al atardecer: eso es lo que intentaban pintar.',
    question: '¿Qué momento del día te gustaría observar con más atención?',
    deeper: 'Buscá la serie de la catedral de Ruan pintada por Monet.',
  },
  {
    id: 'arte-tercios',
    category: 'arte',
    title: 'La regla de los tercios',
    body: 'Es una guía de composición: se divide la imagen en tres partes iguales a lo ancho y a lo alto, y se ubican los elementos importantes cerca de esas líneas o sus cruces. Suele dar imágenes más dinámicas que centrar todo. Es una regla práctica, no una ley: muchas obras valiosas la ignoran.',
    example: 'La mayoría de las cámaras de celular permiten activar una cuadrícula para usarla.',
    question: '¿Qué foto podrías sacar hoy prestando atención a la composición?',
    deeper: 'Compará fotos tuyas centradas y otras siguiendo los tercios.',
  },
  // ── Psicología ──
  {
    id: 'psi-espaciado',
    category: 'psicologia',
    title: 'El efecto de espaciado',
    body: 'A fines del siglo XIX, Hermann Ebbinghaus estudió su propia memoria y observó que repartir los repasos en el tiempo funciona mejor que concentrarlos en una sola sesión. Este «efecto de espaciado» fue replicado muchas veces y es la base de varios métodos de estudio.',
    example: 'Practicar inglés diez minutos por día suele rendir más que dos horas un solo día de la semana.',
    question: '¿Qué estás aprendiendo que podrías repartir en sesiones cortas?',
    deeper: 'Buscá «repetición espaciada» y «curva del olvido».',
  },
  {
    id: 'psi-confirmacion',
    category: 'psicologia',
    title: 'Sesgo de confirmación',
    body: 'Tendemos a buscar, recordar e interpretar la información de forma que confirme lo que ya creemos. No es falta de inteligencia: es un atajo mental frecuente. Una forma de contrarrestarlo es buscar a propósito argumentos en contra de nuestra idea.',
    example: 'Si creés que un día va a salir mal, es fácil fijarte solo en lo que sale mal.',
    question: '¿Qué opinión tuya podrías poner a prueba buscando evidencia contraria?',
    deeper: 'Leé sobre la tarea de selección de Wason.',
  },
  {
    id: 'psi-si-entonces',
    category: 'psicologia',
    title: 'Planes «si… entonces…»',
    body: 'El psicólogo Peter Gollwitzer estudió las «intenciones de implementación»: planes que conectan una situación concreta con una acción («si termino de almorzar, entonces camino diez minutos»). Las investigaciones muestran que, en promedio, ayudan a pasar de la intención a la acción, aunque no garantizan resultados.',
    example: '«Si apoyo la taza del desayuno, entonces escribo mi prioridad del día.»',
    question: '¿Qué hábito podrías anclar a algo que ya hacés todos los días?',
    deeper: 'Probá escribir un plan si-entonces para uno de tus hábitos en RITMO.',
  },
  {
    id: 'psi-planificacion',
    category: 'psicologia',
    title: 'La falacia de la planificación',
    body: 'Daniel Kahneman y Amos Tversky describieron una tendencia a subestimar el tiempo y los recursos que llevará una tarea, incluso sabiendo que tareas parecidas se demoraron antes. Una estrategia útil es mirar cuánto tardaron, en la práctica, proyectos similares.',
    example: 'El «lo hago en una hora» que termina llevando una tarde entera.',
    question: '¿Qué tarea de esta semana conviene planificar con más margen?',
    deeper: 'Buscá el concepto de «visión externa» (outside view) para estimar tiempos.',
  },
  // ── Cultura general ──
  {
    id: 'cul-mate',
    category: 'cultura',
    title: 'El origen del mate',
    body: 'Los pueblos guaraníes ya consumían yerba mate antes de la llegada de los europeos. Durante la época colonial, las misiones jesuíticas organizaron su cultivo. Hoy es una bebida cotidiana en Argentina, Uruguay, Paraguay y el sur de Brasil, y compartirla tiene un fuerte sentido social.',
    example: 'Ofrecer un mate suele ser una invitación a conversar.',
    question: '¿Qué costumbre cotidiana tuya tiene una historia que desconocés?',
    deeper: 'Investigá la planta Ilex paraguariensis y dónde se cultiva.',
  },
  {
    id: 'cul-gregoriano',
    category: 'cultura',
    title: 'El calendario gregoriano',
    body: 'En 1582, el papa Gregorio XIII impulsó una reforma del calendario juliano, que se había desfasado respecto de las estaciones. Para corregirlo, en los países que la adoptaron ese año, al jueves 4 de octubre le siguió el viernes 15 de octubre. Otros países la adoptaron siglos más tarde.',
    example: 'Por eso algunas fechas históricas aparecen con dos versiones según el calendario usado.',
    question: '¿Qué reglas que usás todos los días fueron, en origen, un ajuste práctico?',
    deeper: 'Buscá cuándo adoptaron el calendario gregoriano Rusia o Grecia.',
  },
  {
    id: 'cul-bisiesto',
    category: 'cultura',
    title: '¿Por qué existen los años bisiestos?',
    body: 'El año solar dura aproximadamente 365,2422 días. Para compensar ese cuarto de día, se agrega el 29 de febrero cada cuatro años. Pero como no es exactamente un cuarto, los años terminados en 00 solo son bisiestos si son divisibles por 400: 2000 lo fue, 1900 no.',
    example: 'Quien nace un 29 de febrero tiene su fecha exacta de cumpleaños solo cada cuatro años.',
    question: '¿Qué pequeño ajuste periódico mantiene en orden algo de tu vida?',
    deeper: 'Calculá cuántos días faltan para el próximo 29 de febrero.',
  },
  {
    id: 'cul-metro',
    category: 'cultura',
    title: 'El metro y el sistema métrico',
    body: 'El sistema métrico nació en Francia en la década de 1790 para unificar medidas que variaban de una región a otra. El metro se definió originalmente a partir de la distancia entre el polo norte y el ecuador. Desde 1983 se define a partir de la velocidad de la luz, una constante física.',
    example: 'Gracias a medidas comunes, una pieza fabricada en un país encaja en una máquina de otro.',
    question: '¿Qué «medidas» usás para evaluar tus avances? ¿Son claras?',
    deeper: 'Buscá la redefinición del kilogramo de 2019.',
  },
  {
    id: 'cul-cero',
    category: 'cultura',
    title: 'La historia del cero',
    body: 'Varias culturas usaron un símbolo para marcar un lugar vacío, como los babilonios y los mayas. En la India se desarrolló el cero como número con el que se puede operar: en el siglo VII, el matemático Brahmagupta describió reglas para sumar y restar con él. Esa idea llegó a Europa a través de textos árabes.',
    example: 'Sin el cero, escribir 105 y distinguirlo de 15 sería mucho más complicado.',
    question: '¿Qué idea «obvia» de tu día a día fue en realidad un gran invento?',
    deeper: 'Leé sobre el sistema de numeración posicional y su difusión.',
  },
];
