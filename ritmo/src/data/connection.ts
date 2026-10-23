/** Propuestas pequeñas y voluntarias de conexión y curiosidad. Ninguna es obligatoria. */
export interface ConnectionPrompt {
  id: string;
  category: 'conversacion' | 'escribir' | 'actividad' | 'cultura' | 'pregunta' | 'compartir' | 'sin-pantallas';
  text: string;
}

export const CONNECTION_CATEGORIES: Record<ConnectionPrompt['category'], string> = {
  conversacion: 'Iniciar una conversación',
  escribir: 'Escribirle a alguien',
  actividad: 'Conocer algo nuevo',
  cultura: 'Otra cultura o lugar',
  pregunta: 'Una buena pregunta',
  compartir: 'Tiempo compartido',
  'sin-pantallas': 'Disfrute sin pantallas',
};

export const CONNECTION_PROMPTS: ConnectionPrompt[] = [
  { id: 'c1', category: 'conversacion', text: 'Preguntale a alguien cercano cómo le fue con algo que te contó la última vez.' },
  { id: 'c2', category: 'conversacion', text: 'Saludá por su nombre a alguien que ves seguido (en el almacén, el trabajo, el edificio).' },
  { id: 'c3', category: 'escribir', text: 'Mandale un mensaje a alguien importante solo para saber cómo está.' },
  { id: 'c4', category: 'escribir', text: 'Escribile a alguien para agradecerle algo concreto que hizo por vos.' },
  { id: 'c5', category: 'escribir', text: 'Retomá el contacto con una persona con la que hace tiempo no hablás.' },
  { id: 'c6', category: 'actividad', text: 'Buscá una actividad nueva cerca tuyo (taller, club, caminata grupal) y anotá cuándo es.' },
  { id: 'c7', category: 'actividad', text: 'Probá una comida, receta o lugar que nunca probaste.' },
  { id: 'c8', category: 'cultura', text: 'Aprendé tres datos sobre un país que no conozcas y contáselos a alguien.' },
  { id: 'c9', category: 'cultura', text: 'Escuchá música de un lugar del mundo que nunca hayas escuchado.' },
  { id: 'c10', category: 'cultura', text: 'Averiguá la historia de una calle, plaza o edificio de tu ciudad.' },
  { id: 'c11', category: 'pregunta', text: 'Preguntá: «¿Qué es algo que te entusiasma últimamente?» y escuchá sin apuro.' },
  { id: 'c12', category: 'pregunta', text: 'Preguntá: «¿Qué aprendiste este año que te cambió algo?»' },
  { id: 'c13', category: 'pregunta', text: 'Preguntale a alguien mayor cómo era su barrio cuando era joven.' },
  { id: 'c14', category: 'compartir', text: 'Proponé un mate, un café o una caminata con un amigo o familiar.' },
  { id: 'c15', category: 'compartir', text: 'Comé con alguien sin teléfonos en la mesa.' },
  { id: 'c16', category: 'compartir', text: 'Invitá a alguien a hacer algo que te guste y que no conozca.' },
  { id: 'c17', category: 'sin-pantallas', text: 'Leé, dibujá, cociná o tocá música durante 20 minutos sin pantallas.' },
  { id: 'c18', category: 'sin-pantallas', text: 'Salí a caminar sin auriculares y prestá atención a lo que pasa alrededor.' },
  { id: 'c19', category: 'sin-pantallas', text: 'Hacé algo con las manos: ordenar plantas, arreglar algo, armar algo.' },
];
