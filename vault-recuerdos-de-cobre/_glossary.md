---
tipo: glosario
fuente: DM (lore canónico)
ultima_actualizacion: 2026-05-14
---

# Glosario oficial — Campaña Mysha (Recuerdos de Cobre, Mates y Mazmorras)

Este archivo es la **fuente de verdad única** para el pipeline:
- `scripts/transcribe.py` → usa la lista de nombres para el `initial_prompt` de Whisper.
- `scripts/summarize-transcript.ts` y `scripts/process-episode.ts` → inyectan este texto en el prompt de Gemini.
- `lib/prompts.ts` → el `SYSTEM_PROMPT` de Claude se construye a partir de acá.

**No editar directo en los prompts del código** — editar acá y que el pipeline lo levante.

---

## Personajes jugadores (PJs) y sus jugadores

Formato: `Personaje (nombre completo) — Jugador`

- **Mysha** — Kero. Protagonista, **bruja de sangre**. Crece en el **Coven Rojo** (cuyo nombre original es el **Coven Rosa**); tras la masacre que destruye el coven, queda como su última matriarca y vuelve a ese origen para refundarlo desde cero. Tiene **3 personalidades** que conviven en la misma persona:
  - **Mysha** — personalidad base / principal.
  - **Selenne** — personalidad secundaria.
  - **Veltra** — personalidad secundaria.
  - ⚠️ Cuando el resumen o transcript dice "Selenne hace X" o "ahora habla Veltra", **es la misma persona** (Mysha) actuando bajo otra personalidad. Registrar como **un solo personaje "Mysha"** con `alias: ["Selenne", "Veltra"]` y mencionar la personalidad activa en el campo descripción/contexto de la mención.
  - ⚠️ Whisper la transcribe como **"Milla"** sola o como **"Milla Selen Beltra"** (el nombre completo "Mysha Selenne Veltra" se le escapa). Normalizar todo a "Mysha".
- **Borok** — Mati. Campeón de Vecna (sellado al final del Acto IV). Tiene visiones.
- **Layra** — Layla. Dracónida. Su hogar sufre el ataque del dragón rojo.
  - ⚠️ "Layla" es la **jugadora**, "Layra" es el **personaje** — no confundir.
  - ⚠️ Otras grafías incorrectas vistas: Laira, Layyra. La canónica es **Layra**.
  - ⚠️ **NO confundir con Leira Umbra** — ver sección NPCs Acto Underdark.
- **Narcissa** — Mica. Usa una puerta mágica (estudio cambiante). Casi asesinada por La Dama del Dolor (Sigil).
- **David Ilcard** — Lucho. Asimar defensor de Tyr.
- **Io Campbell** — Mile / Kuzu / Sis / Nico (varios nicknames del mismo jugador). PJ. Naturaleza revelada en Acto III: criatura férrica.
  - ⚠️ Whisper la transcribe como "yo" minúscula. Si "yo" aparece con mayúscula inicial o como nombre propio (no pronombre), es "Io".

### PJs futuros (todavía no aparecen en los episodios procesados)
- **Eryon** — Tiago. Importante en arcos posteriores.

## Familiares / mascotas con nombre

- **Champi** — búho familiar de Mysha.

---

## Dioses principales

- **Mystra** — Magia Arcana. Creador de las **runas arcanas** y de la **"Magia Mística"** (daño de fuerza, también llamada **Magia Caótica**).
- **Vecna** — Secretos, pérdida, dolor.
- **Locky** — Caos, destrucción, engaño, ilusiones, guerra.
- **Tyr** — Justicia y conocimiento.
- **Leira** — Paz, serenidad, divinidad.
- **Druidia** — "Madre naturaleza", toda forma de vida plantoide.
- **Myrkul** — Vida y muerte.
- **Raven Queen** — Recuerdos, almas, frío, sacrificio.
- **Luzne** — Luz, fuego, renovación, sagrado.
- **Selune** — Luna, caza, oscuridad, sacrificio.

## Dioses secundarios

- **Orcus** — Dios orco. Guerrero de los espíritus.
- **Umberlee** — Mar. Hija de Druidia.
- **Talos** — Tormenta. Hijo de Druidia.
- **Tymora** — Suerte. Diosa de los medianos. Hija de Leira.
- **Bahamut** — Dragones metálicos.
- **Tiamat** — Dragones elementales.
- **Moradín** — Dios enano. La forja. "El forjador de almas".
- **Lefaye** — Dios/a de los elfos. Arte, música, poesía.
- **Erina** — Hermana de Lefaye. Diosa de los elfos oscuros.

## Entidades divinas / planares

- **El Dios de Dioses** — figura involucrada en el Ritual de Ascensión y el destierro de la mitad de la humanidad.
- **Demogorgon** — Gran Demonio. Esclavizaba humanos para alimentar su poder a través del terror.
- **Wendigo / Wendigoul** — criatura que persigue a Mysha. Caminante etéreo.
- **La Dama del Dolor** — reina de Sigil (Ciudad de las Puertas).

---

## Razas y facciones políticas

- **La Monarquía de Lefaye** — principalmente elfos, algunos semi-elfos. Tiene un **emperador**.
- **La Gran Aristocracia** — humanos y Tabaxis. Gobierna por **concejales**.
- **La Dinastía de las Alas Metálicas** — Dracónidos, lizardfolk, Shuan Ti.
- **Los Renegados** — todas las razas semi + algunos Tieflings y Kenkus.
- **Imperio de los Grandes** — Enanos.
- **Aldea de Guerreros Espirituales** — Orcos.
- **Aldea de Movedores de Montañas** — Goliaths.
- **Manada de los Rompehuesos** — Monsters.
- **Aldeas de los Molinos** — Halflings y gnomos.

## Facciones / grupos relevantes

- **Hermandad de Cobre** — "rebeldes" escondidos bajo el casino Plumas Doradas. Liderada por Annora.
- **Los Soñadores** — anterior grupo de Nori (amigo de Borok). Incluye a Aria.
- **Los Nefarios** — banda de mercenarios liderada por El Corruptor (príncipe demoníaco).
- **Lanceros del Alba** — principal ejército élfico.
- **Ejército de la Libertad** — Amari Zaled es su teniente coronel.
- **Ejército de Eyra / Las 9 Puntas** — símbolo de 9 puntas.

## Covens

Hay **4 covens** en total: Rojo, Negro, Blanco, Verde.

- **Coven Rojo** — coven de sangre donde Mysha creció y vivió, destruido en la masacre del Wendigo y el Coven Verde. Escribió el libro con la teoría del cuerpo / alma / espíritu; sus secretos están protegidos por un ángel de Tyr (matado en Acto IV). **«Coven Rosa» es su nombre original** (linaje fundado sobre las runas de Mystra y la contención de caminantes etéreos en solsticios); tras la caída, Mysha vuelve a ese origen para refundar el coven desde cero. También aparece nombrado como «Coven de sangre», «Brujas de Sangre» o «Hermanas del Coven Rojo».
- **Coven Negro** — coven de sombras de la matriarca Melissa (formó a Eryon y Aisha), oculto en un bosque petrificado protegido por las Lágrimas de Selune; sitiado por el Wendigo tras la profanación de su cementerio. Aparece también como «Coven Oscuro» / «Coven de oscuridad».
- **Coven Blanco** — uno de los covens; aparece también como «Coven radiante».
- **Coven Verde** — se opuso al Ritual de Ascensión. Mystra subyugó a su matriarca para que aceptara.

---

## NPCs y líderes

### Gran Aristocracia (concejales de la Metrópolis)
- **Annora** — humana con parche en el ojo derecho. Representa la Gran Aristocracia y la Hermandad de Cobre. Poder político importante aunque no es concejala oficial.
- **Vladimir Clarte** — Concejal de Salud, Educación y Trabajo.
- **[?]** — Concejal de Industria y Defensa, **exiliado**. ⚠️ Nombre incompleto en el material original.
- **[?]** — Concejal de Justicia y Administración de Bienes, **reemplazado por el Profesor**. ⚠️ Nombre incompleto.
- **El Profesor** — Concejal de Innovación y Tecnología. Investiga el cuerpo de Zaros Creighton. Reemplaza al concejal de Justicia.
- **Darko** y **Mironov** — involucrados en una trama con el líder oculto de los ocultistas de Vecna. Confirmados juntos en la excavación por Pilar y PatPat.

### Líderes de facciones
- **Apolo Iorxan** — Soberano de la Dinastía de las Alas Metálicas.
- **Orion Bolderminer** — Emperador del Imperio de los Grandes. Mago.
- **Firguc Alasol** — Clérigo. Mano derecha de Orion.
- **Armola Caihana** — "Voz de Yggdrasil". Semi-elfa. Una de las 3 líderes de Los Renegados.
- **Saphira Nyerovik** — Teniente Coronel. Grupo de choque especial de los Renegados. Acompaña a Armola.
- **La Voz de Aldinach** — líder de los Tieflings.
- **El Corruptor** — príncipe demoníaco, líder de Los Nefarios.
- **[?] (ori)** — Padre de Layra. Líder de la revolución de los cromáticos. Dragón de Feywilds. ⚠️ Nombre parcialmente truncado en el material.
- **Teniente General Ciollos y Mortoris Spiritcrown** — al frente de los Lanceros del Alba.
- **Amari Zaled** — Teniente Coronel del Ejército de la Libertad.

### Otros NPCs por acto

**Acto I (Metrópolis de Cobre / Lorenza / Khelgrim):**
- **Lord Faxius** — animador del casino Plumas Doradas.
- **Margarita** — "la Doctora" de la Hermandad. Collar de escorpión y viales.
- **Clara** — camarera joven del casino.
- **Celeste** — mujer alta, vocera de Annora.
- **Carl Jhonson** — pueblerino de Lorenza. Contrato contra gnolls.
- **PatPat** y **Pilar** — acompañantes del grupo. Después confirman vínculo entre Darko, Mironov y el líder ocultista.
- **Sargento Primero Gastón Chersey** — guardia del que escaparon en Lorenza.
- **Zaros Creighton** — antiguo campeón de Vecna, líder duergar en Khelgrim. Pedazo de carne maldito que no puede morir. Sostenía la carta **"Wheel of Fortune"** (artefacto legendario).

**Acto II (Arkala / Desierto de los Espejos):**
- **Zhaar** — humano, monta escorpiones gigantes. Reveló ser **Doppleganger** al final del cruce. Tenía 2 cartas de la fortuna.
- **Sitzil** — Yuan-Ti traidora. Asesinada.

**Acto III (Sanctuario de los Libres):**
- **Freda** y **Larren** — granjeros que vendieron al esclavo Nym al grupo.
- **Nym** — esclavo liberado por el grupo. Buscaba a su hermana. Asesinado por Los Nefarios.
- **Nori** — gran amigo de Borok. Lidera Los Soñadores.
- **Aria** — warlock con pacto con Vecna. Miembro de Los Soñadores. Traicionó al grupo en Acto IV y fue asesinada.
- **Toshi** — gran amigo de David.
- **Raylen** — "El Tirador Blanco". Gunslinger. Originalmente con Los Nefarios. En Acto IV pacta con **Luk** (demonio) por poder a cambio de almas.

**Acto IV (mar):**
- **Capitán Fóster** — capitán del barco volador **"El Diablillo"**.
- **Miriel** y **Orión** — tradeos. ⚠️ ¿Es el mismo Orion Bolderminer? Aclarar.
- **Luk** — demonio que pacta con Raylen.
- **Merfolks** y **Merrows** — civilización marina; los Merfolks eran esclavizados por los Merrows.

**Acto V (Montañas de Frío Eterno):**
- **El genio / semi-dios del tarot** — intercambia deseos por cosas interesantes.
- Grupo de **bisontes amigables**.
- Grupo de **guerreros** interrumpidos por la llegada del dragón rojo.

**Acto Underdark (Episodios 77-82):**
- **Leira Umbra** — gnoma oscura, sacerdotisa ciega de Myrkul en la catedral de Millegroth. También conocida como "Señorita Umbra" o "Umbra". ⚠️ Whisper la transcribe como **"Leira Umbra"** o **"Layra"** por similitud fonética — **NO es Layra (PJ dracónida)**. Son personajes distintos: Layra es dracónida PJ, Leira Umbra es gnoma NPC.
- **Uhtuk** — Mind flayer aliado de Leira Umbra. También: Utuk, Tuk, Uthuk. Reencarna como gnomo en ep. 82 gracias a Layra (PJ) con Intervención Divina de Myrkul.

---

## Lugares

- **Eyra / Eyira** — el continente.
- **Metrópolis de Cobre** — ciudad steampunk medianamente grande. Humanos y Tabaxis. Magia prohibida. Bastión protegido por barrera invisible contra tsunamis anuales.
- **Plumas Doradas** — casino en la Metrópolis. La Hermandad de Cobre se esconde abajo.
- **Lorenza** — aldea bajo ataque de gnolls. Tiene una excavación subterránea que lleva a Khelgrim.
- **Khelgrim** — "El Último Bastión". Ciudad subterránea de duergars seguidores de Vecna.
- **Arkala** — ciudad rica en el Desierto de los Espejos, comercio principal.
- **Desierto de los Espejos** — cruzado en Acto II.
- **Sanctuario de los Libres** — ciudad enorme, principalmente semis, magia como moneda corriente.
- **Mar del Leviatán** — escenario del Acto IV.
- **Montañas de Frío Eterno** — escenario del Acto V. Hielo eterno está derritiéndose por el dragón rojo.
- **Sigil — La Ciudad de las Puertas** — gobernada por La Dama del Dolor. Vista por Narcissa con una carta de la fortuna.
- **Feywilds** — plano feérico. Hogar del dragón padre de Layra.

---

## Conceptos del mundo

### El triple modelo: cuerpo / alma / espíritu (Coven Rojo)
- **Cuerpo** — parte física. "Sensores" para sentir el plano material. Limita la extensión del alma.
- **Alma** — donde residen los sentimientos (amor, odio, tristeza, felicidad). Sin alma, el cuerpo es solo carne con sensación pero sin interpretación.
- **Espíritu** — energía no material, no sentimiento: impulso de vida, voluntad, fe. **Se crea a pares** (espíritus gemelos), uno humanoide ↔ uno animal, conectados por un hilo. Garantiza el balance entre humanoides y animales en el plano material.
- Al morir: el cuerpo queda, el alma flota hacia los planos divinos para ser juzgada, el espíritu reside en el **Plano Etéreo / Plano Espiritual**.

### El Plano Etéreo / Espiritual
- Inalcanzable para humanoides comunes. **Mystra** creó las runas para que el Coven Rojo —entonces bajo su nombre original, Coven Rosa— pudiera atravesar el velo.
- En los **solsticios** (2 veces al año) la barrera se adelgaza y caminantes etéreos pueden cruzar. El Coven Rojo los contiene.

### Magia
- **Magia Mística / Magia Caótica** — creada por Mystra. Daño de fuerza.
- **Magia prohibida** en la Metrópolis de Cobre.
- **Magia común** en el Sanctuario de los Libres.

### Ritual de Ascensión (evento histórico)
- Documentado en el "Libro de Historia del Salón de Sangre".
- Las matriarcas de los covens se reunieron en guerra contra Demogorgon y Vecna.
- El **Coven Rojo** (bajo su nombre original, Coven Rosa) presentó el libro del Ritual: combinando la magia caótica de Mystra y el plano etéreo, podía convertir a alguien en semidiós (= alguien con poder suficiente para que otros lo crean dios).
- **Costo**: el espíritu de la mitad de la población.
- La **Matriarca Verde** se opuso. Mystra la subyugó para que aceptara.
- Antes del ritual, la Matriarca Verde maldijo: "que sus cuerpos sangren, que la naturaleza los odie", reduciendo el número de quienes usen esta magia.
- El ritual destierra a la mitad de la humanidad (cuerpo, alma y espíritu) junto al Dios de Dioses. La guerra termina. Una **nueva diosa asciende** con el objetivo de eliminar los recuerdos de estos eventos.

### Tarot / Wheel of Fortune
- Conjunto de **cartas de la fortuna**, artefactos legendarios.
- Zaros Creighton tenía una en Khelgrim. Zhaar tenía 2 (más). Narcissa usó una para ver Sigil.
- En Acto V el grupo finalmente usa la carta del tarot y aparece un genio/semi-dios.

### Votos de confianza (acuerdos del Acto I)
- **Con Apolo Iorxan (Dinastía Alas Metálicas):** eliminación de [pendiente] restaurando la paz en la Dinastía. A cambio: liberación de monstruos en alrededores de Lorenza.
- **Con Orion Bolderminer (Imperio de los Grandes):** envío de capital humano para trabajar las nuevas tierras cosechables + enseñanza de agricultura eficiente. A cambio: metal para articulaciones y exo-esqueletos.
- **Con Armola Caihana (Voz de Yggdrasil, Renegados):** asesinato del ejército de Lanceros del Alba (incluyendo a Ciollos y Mortoris Spiritcrown). A cambio: ayuda con la revolución.

---

## Sinopsis por acto (referencia rápida)

**Acto I — Metrópolis de Cobre, Lorenza, Khelgrim:**
Conocen a la Hermandad de Cobre. Contrato con Carl Jhonson en Lorenza (gnolls). Misión contra ocultistas de Vecna. Visiones de Borok llevan a Khelgrim, ciudad duergar bajo Lorenza. Encuentran cadáveres + Zaros Creighton con la Wheel of Fortune. Vuelven a la Metrópolis, le dejan el cuerpo al Profesor. Mysha avisa a Margarita, contactan al Coven Negro. Teletransporte a Arkala.

**Acto II — Desierto de los Espejos:**
Conocen a Zhaar (escorpiones). Doppleganger reveal. Sitzil yuan-ti traidora. Tormentas mágicas, ghouls, ghasts. Narcissa ve Sigil y casi muere por La Dama del Dolor. Mysha entra al plano etéreo y la Matriarca le ordena volver al Coven.

**Acto III — Sanctuario de los Libres:**
Compran a Nym. Caminantes etéreos persiguen a Mysha (Wendigo cerca). Conocen a Nori, Aria, Toshi. Templos de Druidia, Luzne, Tyr → revelan que Io es criatura férrica. Annora visita a Layra en sueños (trama del Profesor + Darko + Mironov). Torneo de las Almas (Mysha 1er puesto, Layra discurso sobre dragón). Conocen a Raylen y los Nefarios. Amari Zaled compromete escudería. Emboscada de los Nefarios: matan a Nym, su hermana y varios amigos. El Corruptor = príncipe demoníaco con vínculos a altos cargos del Sanctuario.

**Acto IV — Mar del Leviatán:**
Visión de Borok: artefacto en el agua. Mysha es llamada por su Coven. Enfrentan ser férrico. Borok se une al Coven. Matan ángel de Tyr (visión de David, casi pierde su divinidad). Mysha recupera memoria: vio cómo el Coven Verde usó el ataque del Wendigo para infiltrar el Coven Rojo y robar el libro de rituales de la primera matriarca (Raven Queen, ascendida a dios). Mystra presente en el ritual. Tepean a "El Diablillo" (Capitán Fóster). Tradeos con Miriel y Orión. Ayudan a Merfolks vs Merrows. Aria traiciona y roba el tesoro; la matan. Borok sella pacto con Vecna → campeón. Obtienen **artefacto que disipa cualquier magia (hasta nivel 9)**.

**Acto V — Montañas de Frío Eterno:**
Usan la carta del tarot → genio/semi-dios que intercambia deseos. Tratos con bisontes amigables. Conocen guerreros, interrumpidos por la llegada del dragón rojo (escapan todos).

---

## Pendientes de aclaración (DM)

El usuario no tiene respuesta — quedan abiertos para preguntarle al DM cuando se pueda. **No bloquean** el pipeline, son detalles que iremos llenando.

1. **Nombre completo del padre de Layra** (líder revolución cromáticos, Dragón de Feywilds). Texto original truncado: "ori".
2. **Concejal de Industria y Defensa (exiliado)** — nombre.
3. **Concejal de Justicia y Administración de Bienes** (reemplazado por el Profesor) — nombre.
4. **Investigador actual del hallazgo de Lorenza** — ¿es el Profesor u otro?
5. **Acto IV "tradeos con Miriel y Orión"** — ¿Orión = Orion Bolderminer u otro?
6. **Acto V "tratos con [abis]"** — palabra truncada.
7. **Voto con Apolo Iorxan** — "eliminación de [?]" / "eliminando también al [?]" (a quiénes).
8. **Líder ocultista de Vecna** (el que escapó en la Metrópolis, Acto I) — ¿nombre canónico?

## Confirmaciones del usuario (2026-05-14)

- **PJs canónicos**: Mysha Selenne Veltra (Kero), Borok (Mati), Layra (Layla), Narcissa (Mica), David Ilcard (Lucho), Io Campbell (Mile/Kuzu/Sis/Nico). Aparecerá **Eryon** (Tiago) más adelante.
- **Annora**: solo NPC, no PJ.
- **"ahre"**: onomatopeya, no parte del nombre.
- **"Selenne" / "Veltra"**: NO son personajes aparte — son **personalidades** distintas que conviven dentro de Mysha (misma persona, mismo cuerpo, tres personalidades).
