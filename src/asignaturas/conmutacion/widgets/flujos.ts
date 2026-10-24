// Flujos de mensajes de Conmutación (los diagramas de secuencia del sitio
// antiguo). Un mensaje con de === a es una acción local de ese actor (p. ej.
// «SIM calcula SRES_B»). «fase» rotula el tramo que empieza en ese mensaje.
// «_X» al final de un nombre (SRES_A, Kc_B) se dibuja como subíndice.

export type Mensaje = { de: string; a: string; texto: string; nota?: string; respuesta?: boolean; fase?: string };
export type Flujo = {
  id: string;
  titulo: string;
  actores: string[];
  ancho: number; // ancho del dibujo en px
  leyenda: { radio?: string; map?: string; tramas?: string };
  mensajes: Mensaje[];
};

export const FLUJOS: Flujo[] = [
  {
    id: "llamada-entrante",
    titulo: "Canales en una llamada entrante",
    actores: [
      "MS",
      "BSS",
      "MSC"
    ],
    ancho: 860,
    leyenda: {
      radio: "Canales de la interfaz aérea"
    },
    mensajes: [
      {
        de: "BSS",
        a: "MS",
        texto: "PCH: aviso de llamada (paging)",
        nota: "La red avisa por el canal de aviso, en todas las células del área de localización. Es un canal común: todos los móviles lo escuchan."
      },
      {
        de: "MS",
        a: "BSS",
        texto: "RACH: petición de canal",
        nota: "El móvil contesta pidiendo un canal dedicado. Es acceso aleatorio (ALOHA ranurado), así que puede haber colisión con otros móviles."
      },
      {
        de: "BSS",
        a: "MS",
        texto: "AGCH: asignación de un SDCCH",
        nota: "La red concede un canal de señalización dedicado. Los móviles con petición pendiente escuchan este canal.",
        respuesta: true
      },
      {
        de: "MS",
        a: "MSC",
        texto: "SDCCH: señalización (identidad, autenticación, cifrado)",
        nota: "Ya con canal propio, el móvil hace los procedimientos de señalización (los de MM del tema de movilidad)."
      },
      {
        de: "MSC",
        a: "MS",
        texto: "SDCCH: llamada y asignación de canal de tráfico",
        nota: "Cuando la señalización acaba, la red asigna un TCH. El SDCCH se devuelve y queda libre para otro móvil."
      },
      {
        de: "MS",
        a: "BSS",
        texto: "TCH + SACCH: conversación y medidas",
        nota: "La voz va por el TCH. El SACCH asociado lleva las medidas de calidad cada 480 ms para el traspaso."
      }
    ]
  },
  {
    id: "hdlc-rej",
    titulo: "Tramas HDLC en modo ABM con un REJ",
    actores: [
      "A",
      "B"
    ],
    ancho: 700,
    leyenda: {
      tramas: "Tramas HDLC en modo ABM (3 bits de secuencia)"
    },
    mensajes: [
      {
        de: "A",
        a: "B",
        texto: "SABM",
        nota: "A pide abrir la conexión en modo balanceado."
      },
      {
        de: "B",
        a: "A",
        texto: "UA",
        nota: "B acepta. La conexión está establecida.",
        respuesta: true
      },
      {
        de: "A",
        a: "B",
        texto: "I(0,0)",
        nota: "Notación I(N(S), N(R)). A envía su trama 0 y todavía no ha recibido nada de B."
      },
      {
        de: "B",
        a: "A",
        texto: "RR(1)",
        nota: "B confirma: ha recibido la 0 y espera la 1.",
        respuesta: true
      },
      {
        de: "A",
        a: "B",
        texto: "I(1,0) se pierde",
        nota: "La trama 1 sufre un error de transmisión: el FCS no cuadra y B la descarta.",
        respuesta: true
      },
      {
        de: "A",
        a: "B",
        texto: "I(2,0)",
        nota: "La trama 2 sí llega, pero B esperaba la 1."
      },
      {
        de: "B",
        a: "A",
        texto: "REJ(1)",
        nota: "B avisa del fallo de secuencia: reenvía todo desde la 1. Con REJ el receptor solo procesa en orden, así que la 2 se descarta aunque llegó bien.",
        respuesta: true
      },
      {
        de: "A",
        a: "B",
        texto: "I(1,0)",
        nota: "A retransmite desde la 1."
      },
      {
        de: "A",
        a: "B",
        texto: "I(2,0)"
      },
      {
        de: "B",
        a: "A",
        texto: "RR(3)",
        nota: "B confirma todo hasta la 2 y espera la 3.",
        respuesta: true
      },
      {
        de: "A",
        a: "B",
        texto: "DISC",
        nota: "A pide liberar la conexión."
      },
      {
        de: "B",
        a: "A",
        texto: "UA",
        nota: "B confirma la liberación.",
        respuesta: true
      }
    ]
  },
  {
    id: "contienda-lapdm",
    titulo: "Resolución de contienda en LAPDm",
    actores: [
      "MS 1",
      "MS 2",
      "BTS-BSC"
    ],
    ancho: 860,
    leyenda: {
      radio: "Canales de la interfaz aérea"
    },
    mensajes: [
      {
        de: "MS 1",
        a: "BTS-BSC",
        texto: "RACH: petición de canal",
        nota: "El móvil 1 pide canal por el RACH."
      },
      {
        de: "MS 2",
        a: "BTS-BSC",
        texto: "RACH: petición de canal",
        nota: "El móvil 2 pide canal casi a la vez y la red no distingue las dos peticiones."
      },
      {
        de: "BTS-BSC",
        a: "MS 1",
        texto: "AGCH: asignación (SDCCH 1)",
        nota: "Una sola asignación, que oyen los dos móviles. Cada uno cree que es para él.",
        respuesta: true
      },
      {
        de: "MS 1",
        a: "BTS-BSC",
        texto: "SABM [L3 (id MS 1)] en SDCCH 1",
        nota: "Cada móvil abre la conexión LAPDm en el canal asignado, metiendo su identidad en el mensaje de capa 3."
      },
      {
        de: "MS 2",
        a: "BTS-BSC",
        texto: "SABM [L3 (id MS 2)] en SDCCH 1",
        nota: "Los dos transmiten en la misma ranura: la BTS se queda con una de las dos."
      },
      {
        de: "BTS-BSC",
        a: "MS 1",
        texto: "UA [L3 (id MS 1)]",
        nota: "La respuesta repite el mensaje de capa 3 recibido. El móvil 1 reconoce su propia identidad y sigue.",
        respuesta: true
      },
      {
        de: "BTS-BSC",
        a: "MS 2",
        texto: "DM [L3 (id MS 1)]",
        nota: "El móvil 2 ve un mensaje que no es el suyo: ha perdido la contienda y tiene que volver a pedir canal por el RACH.",
        respuesta: true
      },
      {
        de: "MS 1",
        a: "BTS-BSC",
        texto: "I(0,0) [datos]",
        nota: "El móvil 1 envía su primera trama de información."
      },
      {
        de: "BTS-BSC",
        a: "MS 1",
        texto: "RR(1)",
        nota: "La BTS confirma.",
        respuesta: true
      },
      {
        de: "MS 1",
        a: "BTS-BSC",
        texto: "DISC",
        nota: "Al terminar, el móvil libera la conexión."
      },
      {
        de: "BTS-BSC",
        a: "MS 1",
        texto: "UA",
        respuesta: true
      }
    ]
  },
  {
    id: "traspaso-bsc",
    titulo: "Traspaso entre BSC de un mismo MSC",
    actores: [
      "MS",
      "BTS 1",
      "BSC 1",
      "MSC",
      "BSC 2",
      "BTS 2"
    ],
    ancho: 1000,
    leyenda: {
      radio: "Mensajes de radio y de gestión (RR, BTSM, BSSMAP)"
    },
    mensajes: [
      {
        de: "MS",
        a: "BTS 1",
        texto: "Measurement Report",
        nota: "El móvil informa de lo que mide, sobre todo del nivel de las células vecinas (SACCH)."
      },
      {
        de: "BTS 1",
        a: "BSC 1",
        texto: "Measurement Result",
        nota: "La BTS añade sus propias medidas y se lo pasa a la BSC."
      },
      {
        de: "BSC 1",
        a: "MSC",
        texto: "Handover Required",
        nota: "La BSC 1 aplica sus umbrales. La célula destino no es suya, así que pide el traspaso al MSC."
      },
      {
        de: "MSC",
        a: "BSC 2",
        texto: "Handover Request",
        nota: "El MSC pide a la BSC 2 que prepare un canal para el móvil."
      },
      {
        de: "BSC 2",
        a: "BTS 2",
        texto: "Channel Activation",
        nota: "La BSC 2 manda a la BTS 2 activar un canal."
      },
      {
        de: "BTS 2",
        a: "BSC 2",
        texto: "Channel Activation ACK",
        nota: "La BTS 2 confirma que el canal está listo.",
        respuesta: true
      },
      {
        de: "BSC 2",
        a: "MSC",
        texto: "Handover Request ACK",
        nota: "La BSC 2 contesta al MSC con los datos del canal (lleva el identificador del traspaso).",
        respuesta: true
      },
      {
        de: "MSC",
        a: "BSC 1",
        texto: "Handover Command",
        nota: "El MSC ordena el traspaso por el camino de origen."
      },
      {
        de: "BSC 1",
        a: "BTS 1",
        texto: "Handover Command"
      },
      {
        de: "BTS 1",
        a: "MS",
        texto: "Handover Command",
        nota: "Llega al móvil con la frecuencia y la ranura del canal nuevo."
      },
      {
        de: "MS",
        a: "BTS 2",
        texto: "Handover Access",
        nota: "El móvil salta a la célula nueva y transmite una ráfaga de acceso (no sabe aún su avance temporal)."
      },
      {
        de: "BTS 2",
        a: "MS",
        texto: "Physical Information",
        nota: "La BTS 2 le da el avance temporal (timing advance) que necesita.",
        respuesta: true
      },
      {
        de: "MS",
        a: "BTS 2",
        texto: "SABM",
        nota: "El móvil abre la conexión LAPDm en el canal nuevo."
      },
      {
        de: "BTS 2",
        a: "MS",
        texto: "UA",
        nota: "La BTS 2 confirma.",
        respuesta: true
      },
      {
        de: "MS",
        a: "BTS 2",
        texto: "Handover Complete",
        nota: "El móvil avisa de que ya está en el canal nuevo."
      },
      {
        de: "BTS 2",
        a: "BSC 2",
        texto: "Handover Complete"
      },
      {
        de: "BSC 2",
        a: "MSC",
        texto: "Handover Complete",
        nota: "El MSC sabe que el traspaso ha terminado y puede liberar el canal antiguo."
      },
      {
        de: "MSC",
        a: "BSC 1",
        texto: "Clear Command",
        nota: "Liberación de los recursos de la célula de origen."
      },
      {
        de: "BSC 1",
        a: "BTS 1",
        texto: "Clear Command"
      },
      {
        de: "BTS 1",
        a: "BSC 1",
        texto: "Clear Complete",
        respuesta: true
      },
      {
        de: "BSC 1",
        a: "MSC",
        texto: "Clear Complete",
        nota: "Fin: el móvil sigue en la llamada, ahora por la BTS 2.",
        respuesta: true
      }
    ]
  },
  {
    id: "autenticacion",
    titulo: "Autenticación y cifrado",
    actores: [
      "MS",
      "BSS",
      "MSC/VLR",
      "HLR/AuC"
    ],
    ancho: 880,
    leyenda: {
      radio: "Mensajes radio (RR, MM, CM)",
      map: "Mensajes MAP (SS7, red fija)"
    },
    mensajes: [
      {
        de: "MS",
        a: "BSS",
        texto: "RR-Channel Request (RACH)",
        nota: "El móvil necesita un servicio (llamada, actualización, registro) y pide un canal."
      },
      {
        de: "BSS",
        a: "MS",
        texto: "RR-Immediate Assignment (AGCH)",
        nota: "La red le da un canal dedicado (SDCCH): ya hay conexión RR.",
        respuesta: true
      },
      {
        de: "MS",
        a: "MSC/VLR",
        texto: "CM-Service Request (IMSI/TMSI)",
        nota: "El móvil pide el servicio indicando su identidad. La autenticación la inicia la red.",
        fase: "CONEXIÓN RR ESTABLECIDA (SDCCH)"
      },
      {
        de: "MSC/VLR",
        a: "HLR/AuC",
        texto: "MAP-SEND AUTH INFO (IMSI)",
        nota: "El MSC/VLR pide al HLR la verificación del IMSI, y el HLR al AuC la tripleta."
      },
      {
        de: "HLR/AuC",
        a: "MSC/VLR",
        texto: "MAP-SEND AUTH INFO ack (RAND, SRES_A, Kc_A)",
        nota: "El AuC genera RAND, SRES = A3(Ki, RAND) y Kc = A8(Ki, RAND). El HLR comprueba que el IMSI es cliente y tiene el servicio contratado, y entrega la tripleta.",
        respuesta: true
      },
      {
        de: "MSC/VLR",
        a: "MS",
        texto: "MM-Authentication Request (RAND)",
        nota: "Solo se manda el RAND (el MSC lo pasa al BSS y este al móvil)."
      },
      {
        de: "MS",
        a: "MS",
        texto: "SIM calcula SRES_B y Kc_B"
      },
      {
        de: "MS",
        a: "MSC/VLR",
        texto: "MM-Authentication Response (SRES_B)",
        nota: "La SIM tiene Ki, A3 y A8: calcula su respuesta y su propia clave de cifrado."
      },
      {
        de: "MSC/VLR",
        a: "MSC/VLR",
        texto: "¿SRES_A = SRES_B?"
      },
      {
        de: "MSC/VLR",
        a: "BSS",
        texto: "Kc_A",
        nota: "Si coinciden, el MSC entrega Kc al BSS (no al móvil)."
      },
      {
        de: "BSS",
        a: "MS",
        texto: "RR-Cipher Mode Command",
        nota: "El BSS ordena pasar a modo cifrado."
      },
      {
        de: "MS",
        a: "BSS",
        texto: "RR-Cipher Mode Complete",
        nota: "Desde aquí todo va cifrado con Kc.",
        respuesta: true
      },
      {
        de: "MSC/VLR",
        a: "MS",
        texto: "CM-Service Accepted",
        nota: "Servicio aceptado.",
        respuesta: true
      }
    ]
  },
  {
    id: "actualizacion-a",
    titulo: "Actualización de posición, caso A: registro completo",
    actores: [
      "MS",
      "BSS",
      "MSC",
      "VLR",
      "HLR/AuC"
    ],
    ancho: 960,
    leyenda: {
      radio: "Mensajes radio",
      map: "Mensajes MAP (SS7)"
    },
    mensajes: [
      {
        de: "MS",
        a: "MSC",
        texto: "LU-Request (LAI)",
        nota: "El móvil pide actualizar su posición. En el dibujo el BSS es solo la tubería por la que pasan las flechas.",
        fase: "CONEXIÓN RR"
      },
      {
        de: "MSC",
        a: "VLR",
        texto: "MAP-UPDATE_LOCATION_AREA (IMSI, LAI)",
        nota: "El MSC pasa la petición a su VLR."
      },
      {
        de: "VLR",
        a: "HLR/AuC",
        texto: "MAP-UPDATE_LOCATION (IMSI)",
        nota: "El VLR avisa al HLR de dónde está ahora el abonado."
      },
      {
        de: "HLR/AuC",
        a: "VLR",
        texto: "MAP-INSERT_SUBSCRIBER_DATA (registro MS)",
        nota: "El HLR le da al VLR el perfil del abonado.",
        respuesta: true
      },
      {
        de: "VLR",
        a: "HLR/AuC",
        texto: "MAP-INSERT_SUBSCRIBER_DATA ack",
        respuesta: true
      },
      {
        de: "HLR/AuC",
        a: "VLR",
        texto: "MAP-UPDATE_LOCATION ack",
        respuesta: true
      },
      {
        de: "VLR",
        a: "HLR/AuC",
        texto: "MAP-SEND AUTH INFO (IMSI)",
        fase: "AUTENTICACIÓN"
      },
      {
        de: "HLR/AuC",
        a: "VLR",
        texto: "MAP-SEND AUTH INFO ack (RAND, SRES_A, Kc)",
        respuesta: true
      },
      {
        de: "VLR",
        a: "MSC",
        texto: "MAP-AUTHENTICATE (RAND)"
      },
      {
        de: "MSC",
        a: "MS",
        texto: "Auth. Request (RAND)"
      },
      {
        de: "MS",
        a: "MSC",
        texto: "Auth. Response (SRES_B)"
      },
      {
        de: "MSC",
        a: "VLR",
        texto: "MAP-AUTHENTICATE ack (SRES_B)",
        respuesta: true
      },
      {
        de: "VLR",
        a: "MSC",
        texto: "MAP-SET CIPHERING MODE (Kc)",
        fase: "CIFRADO"
      },
      {
        de: "MSC",
        a: "MS",
        texto: "Ciph. Mode Command (Kc)"
      },
      {
        de: "MS",
        a: "MSC",
        texto: "Ciph. Mode Complete",
        respuesta: true
      },
      {
        de: "MSC",
        a: "VLR",
        texto: "MAP-SET CIPHERING MODE ack",
        respuesta: true
      },
      {
        de: "VLR",
        a: "MSC",
        texto: "MAP-FORWARD NEW TMSI (TMSI)",
        fase: "ASIGNACIÓN DE TMSI NUEVO"
      },
      {
        de: "MSC",
        a: "MS",
        texto: "TMSI Realloc. Command (TMSI)"
      },
      {
        de: "MS",
        a: "MSC",
        texto: "TMSI Realloc. Complete",
        respuesta: true
      },
      {
        de: "MSC",
        a: "VLR",
        texto: "MAP-FORWARD NEW TMSI ack",
        respuesta: true
      },
      {
        de: "VLR",
        a: "MSC",
        texto: "MAP-UPDATE LOCATION AREA ack",
        respuesta: true
      },
      {
        de: "MSC",
        a: "MS",
        texto: "LU-Confirm (LAI)",
        nota: "Registro terminado: el móvil ya tiene TMSI y la red sabe su LA.",
        respuesta: true
      }
    ]
  },
  {
    id: "actualizacion-b",
    titulo: "Actualización de posición, caso B: cambio de LA en el mismo VLR",
    actores: [
      "MS",
      "MSC / VLR"
    ],
    ancho: 720,
    leyenda: {
      radio: "Mensajes radio"
    },
    mensajes: [
      {
        de: "MS",
        a: "MSC / VLR",
        texto: "LU-Request (TMSI_A, LAI_A, LAI_B)",
        nota: "El móvil se identifica con su TMSI antiguo y dice de qué LA viene (A) y a cuál ha llegado (B).",
        fase: "CONEXIÓN RR"
      },
      {
        de: "MSC / VLR",
        a: "MSC / VLR",
        texto: "el VLR cambia LAI_A por LAI_B"
      },
      {
        de: "MSC / VLR",
        a: "MS",
        texto: "LU-Confirm (LAI_B)",
        nota: "Confirmación. Sin HLR de por medio.",
        respuesta: true,
        fase: "AUTENTICACIÓN · CIFRADO · TMSI NUEVO"
      }
    ]
  },
  {
    id: "actualizacion-c",
    titulo: "Actualización de posición, caso C: cambio de VLR",
    actores: [
      "MS",
      "MSC / VLR nuevo",
      "VLR anterior",
      "HLR/AuC"
    ],
    ancho: 900,
    leyenda: {
      radio: "Mensajes radio",
      map: "Mensajes MAP (SS7)"
    },
    mensajes: [
      {
        de: "MS",
        a: "MSC / VLR nuevo",
        texto: "LU-Request (TMSI_A, LAI_A, LAI_B)",
        nota: "El móvil se presenta con un TMSI que este VLR no conoce.",
        fase: "CONEXIÓN RR"
      },
      {
        de: "MSC / VLR nuevo",
        a: "VLR anterior",
        texto: "MAP-SEND IDENTIFICATION (TMSI_A, LAI_A)",
        nota: "Por el LAI antiguo, el VLR nuevo sabe a quién preguntar."
      },
      {
        de: "VLR anterior",
        a: "MSC / VLR nuevo",
        texto: "MAP-SEND IDENTIFICATION ack (IMSI)",
        nota: "El VLR anterior devuelve el IMSI.",
        respuesta: true
      },
      {
        de: "MSC / VLR nuevo",
        a: "HLR/AuC",
        texto: "MAP-UPDATE LOCATION (IMSI)",
        nota: "Ahora sí hay que avisar al HLR de la nueva posición.",
        fase: "CREACIÓN DE REGISTRO EN EL VLR NUEVO"
      },
      {
        de: "HLR/AuC",
        a: "VLR anterior",
        texto: "MAP-CANCEL LOCATION (extra*)",
        nota: "Extra: el HLR manda borrar el registro del VLR antiguo.",
        respuesta: true,
        fase: "AUTENTICACIÓN · CIFRADO · TMSI NUEVO"
      },
      {
        de: "MSC / VLR nuevo",
        a: "MS",
        texto: "LU-Confirm (LAI_B)",
        respuesta: true
      }
    ]
  },
  {
    id: "llamada-saliente",
    titulo: "Llamada originada en el móvil (MOC)",
    actores: ["MS", "BSS", "MSC"],
    ancho: 860,
    leyenda: {
      radio: "Mensajes de la interfaz aérea (canal entre paréntesis)"
    },
    mensajes: [
      {
        de: "MS",
        a: "BSS",
        texto: "RR-Channel Request (RACH)",
        nota: "El usuario marca y pulsa llamar: el móvil pide un canal por el acceso aleatorio.",
        fase: "CONEXIÓN RR"
      },
      {
        de: "BSS",
        a: "MS",
        texto: "RR-Immediate Assignment (AGCH)",
        nota: "La BSC concede un SDCCH y se lo comunica por el AGCH.",
        respuesta: true
      },
      {
        de: "MS",
        a: "MSC",
        texto: "CM-Service Request (SDCCH)",
        nota: "Primer mensaje por el canal dedicado: el móvil pide el servicio y se identifica (TMSI). La BSC lo reenvía al MSC/VLR.",
        fase: "SOLICITUD DE SERVICIO"
      },
      {
        de: "MSC",
        a: "MS",
        texto: "MM-Authentication Request (SDCCH)",
        nota: "Si el móvil ya está registrado, el MSC/VLR le lanza el RAND. Si no, antes haría el registro con el HLR."
      },
      {
        de: "MS",
        a: "MSC",
        texto: "MM-Authentication Response (SDCCH)",
        nota: "El móvil devuelve SRES.",
        respuesta: true
      },
      {
        de: "MSC",
        a: "MS",
        texto: "RR-Cipher Command (SDCCH)",
        nota: "Se ordena pasar a modo cifrado."
      },
      {
        de: "MS",
        a: "MSC",
        texto: "RR-Cipher Complete (SDCCH)",
        respuesta: true
      },
      {
        de: "MS",
        a: "MSC",
        texto: "CM-Set-Up (SDCCH)",
        nota: "Establecimiento de la llamada: lleva el número llamado (MSISDN). Opcionalmente el MSC pide antes el IMEI y lo comprueba en el EIR.",
        fase: "ESTABLECIMIENTO DE LA LLAMADA (INICIAL)"
      },
      {
        de: "MSC",
        a: "MS",
        texto: "CM-Call Proceeding (SDCCH)",
        nota: "La red acepta el intento y lo encamina.",
        respuesta: true
      },
      {
        de: "MSC",
        a: "MS",
        texto: "RR-Assignment Command (SDCCH)",
        nota: "El MSC pide un canal de tráfico al BSS, que se lo asigna al móvil por el SDCCH. Aquí acaba el uso del SDCCH.",
        fase: "ASIGNACIÓN DEL CANAL DE TRÁFICO"
      },
      {
        de: "MS",
        a: "BSS",
        texto: "RR-Assignment Complete (FACCH)",
        nota: "Ya en el TCH, la señalización va por el FACCH (roba ráfagas a la voz).",
        respuesta: true
      },
      {
        de: "MSC",
        a: "MS",
        texto: "CM-Alerting (FACCH)",
        nota: "El llamado está sonando: el móvil pone tono de llamada.",
        fase: "ESTABLECIMIENTO DE LA LLAMADA (RESTO)"
      },
      {
        de: "MSC",
        a: "MS",
        texto: "CM-Connect (FACCH)",
        nota: "El llamado ha contestado (la red recibe ISUP-ANM)."
      },
      {
        de: "MS",
        a: "MSC",
        texto: "CM-Connect Acknowledge (FACCH)",
        nota: "Empieza la conversación por el TCH.",
        respuesta: true
      }
    ]
  },
  {
    id: "llamada-terminada",
    titulo: "Llamada terminada en el móvil (MTC)",
    actores: ["MS", "BSS", "MSC"],
    ancho: 860,
    leyenda: {
      radio: "Mensajes de la interfaz aérea (canal entre paréntesis)"
    },
    mensajes: [
      {
        de: "MSC",
        a: "MS",
        texto: "RR-Paging Request (TMSI) (PCH)",
        nota: "Se avisa por el PCH en todas las células del área de localización.",
        fase: "AVISO Y CONEXIÓN RR"
      },
      {
        de: "MS",
        a: "BSS",
        texto: "RR-Channel Request (RACH)",
        nota: "El móvil se reconoce y pide un canal."
      },
      {
        de: "BSS",
        a: "MS",
        texto: "RR-Immediate Assignment (AGCH)",
        nota: "La BSC le da un SDCCH.",
        respuesta: true
      },
      {
        de: "MS",
        a: "MSC",
        texto: "CM-Paging Response (SDCCH)",
        nota: "Hace de solicitud de servicio: el móvil contesta al aviso ya con canal dedicado.",
        fase: "SOLICITUD DE SERVICIO"
      },
      {
        de: "MSC",
        a: "MS",
        texto: "MM-Authentication Request (SDCCH)"
      },
      {
        de: "MS",
        a: "MSC",
        texto: "MM-Authentication Response (SDCCH)",
        respuesta: true
      },
      {
        de: "MSC",
        a: "MS",
        texto: "RR-Cipher Command (SDCCH)"
      },
      {
        de: "MS",
        a: "MSC",
        texto: "RR-Cipher Complete (SDCCH)",
        respuesta: true
      },
      {
        de: "MSC",
        a: "MS",
        texto: "CM-Set-Up (SDCCH)",
        nota: "A diferencia del MOC, aquí es la red quien inicia el establecimiento.",
        fase: "ESTABLECIMIENTO DE LA LLAMADA (INICIAL)"
      },
      {
        de: "MS",
        a: "MSC",
        texto: "CM-Call Confirmed (SDCCH)",
        nota: "Único mensaje nuevo de GSM respecto a Q.931: el móvil confirma que puede atender la llamada.",
        respuesta: true
      },
      {
        de: "MSC",
        a: "MS",
        texto: "RR-Assignment Command (SDCCH)",
        nota: "Se asigna el canal de tráfico.",
        fase: "ASIGNACIÓN DEL CANAL DE TRÁFICO"
      },
      {
        de: "MS",
        a: "BSS",
        texto: "RR-Assignment Complete (FACCH)",
        respuesta: true
      },
      {
        de: "MS",
        a: "MSC",
        texto: "CM-Alerting (FACCH)",
        nota: "El móvil suena: avisa a la red, que lo traslada al que llama.",
        fase: "ESTABLECIMIENTO DE LA LLAMADA (RESTO)"
      },
      {
        de: "MS",
        a: "MSC",
        texto: "CM-Connect (FACCH)",
        nota: "El usuario descuelga."
      },
      {
        de: "MSC",
        a: "MS",
        texto: "CM-Connect Acknowledge (FACCH)",
        nota: "Empieza la conversación por el TCH.",
        respuesta: true
      }
    ]
  },
  {
    id: "encaminamiento-msrn",
    titulo: "Encaminamiento de una llamada entrante con MSRN",
    actores: ["GMSC", "HLR", "VLR", "MSC", "BSS", "MS"],
    ancho: 980,
    leyenda: {
      radio: "ISUP y mensajes de la interfaz aérea",
      map: "Mensajes MAP (SS7, red fija)"
    },
    mensajes: [
      {
        de: "GMSC",
        a: "HLR",
        texto: "MAP-SEND ROUTING INFO (MSISDN)",
        nota: "La llamada llegó al GMSC con un ISUP-IAM(MSISDN). El GMSC pregunta al HLR dónde está el abonado.",
        fase: "AVERIGUAR EL MSRN"
      },
      {
        de: "HLR",
        a: "VLR",
        texto: "MAP-PROVIDE ROAMING NUMBER (IMSI)",
        nota: "El HLR traduce el MSISDN a IMSI y pide un número de roaming al VLR donde está registrado el móvil."
      },
      {
        de: "VLR",
        a: "HLR",
        texto: "MAP-PROVIDE ROAMING NUMBER ack (MSRN)",
        nota: "El VLR crea un MSRN temporal (VCC + VNDC + SN) que oculta la identidad y la posición del móvil.",
        respuesta: true
      },
      {
        de: "HLR",
        a: "GMSC",
        texto: "MAP-SEND ROUTING INFO ack (MSRN)",
        respuesta: true
      },
      {
        de: "GMSC",
        a: "MSC",
        texto: "ISUP-IAM (MSRN)",
        nota: "El GMSC ya encamina la llamada hacia el MSC visitado usando el MSRN.",
        fase: "LLEGAR AL MÓVIL"
      },
      {
        de: "MSC",
        a: "VLR",
        texto: "MAP-SEND INFO FOR INCOMING CALL (MSRN)",
        nota: "El MSC visitado pregunta al VLR a quién corresponde ese MSRN."
      },
      {
        de: "VLR",
        a: "MSC",
        texto: "MAP-PAGE (TMSI, LAI)",
        nota: "El VLR devuelve el TMSI y el área de localización donde avisar.",
        respuesta: true
      },
      {
        de: "MSC",
        a: "MS",
        texto: "RR-PAGE (TMSI)",
        nota: "El aviso sale por el PCH en el LA. Después siguen autenticación, cifrado y establecimiento de la llamada (como en el MTC)."
      }
    ]
  }
];
