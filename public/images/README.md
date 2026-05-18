# Imágenes de la antología

Arquitectura **reemplazable**: ningún componente referencia archivos de
imagen directamente. La resolución vive en `lib/images.ts` (`resolveImage`)
y el render en `components/public/AtlasImage.tsx`.

## Cómo se decide qué se muestra

1. Si el **frontmatter** de la entidad/episodio define `image`, se usa esa ruta.
2. Si no, se cae a un **placeholder** visual (CSS, clase `.ph` + glifo por tipo).

No hay que tocar React para cambiar una imagen: alcanza con dejar el archivo
acá y apuntar el frontmatter.

## Convención de carpetas

```
public/images/
  personajes/      lugares/      facciones/
  objetos/         misterios/    worldbuilding/
  episodios/
  placeholders/    # genéricos opcionales, mismo esquema por tipo
```

## Cómo reemplazar un placeholder

En el `.md` de la entidad (vault), agregar al frontmatter:

```yaml
image: "/images/personajes/borok.webp"
imageAlt: "Retrato de Borok, semi-orco de la Hermandad de Cobre"
```

`image` es una ruta web servida desde `public/` (empieza con `/images/...`).
`imageAlt` es opcional; si falta se usa un alt descriptivo por defecto.

Formato sugerido: `.webp` (atmosférico, < 300 KB). Las imágenes finales las
pone Joaquín; mientras tanto el placeholder mantiene el layout estable
(el contenedor reserva el `aspect-ratio`, no hay saltos).
