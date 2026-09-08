# File Converter (Transmute)

Outil DevToolbox qui proxifie une instance [Transmute](https://transmute.sh/) self-hosted pour convertir images, documents, audio, vidéo, etc.

Le **Image Resizer** reste indépendant (WebP / presets WordPress côté navigateur).

## Configuration

1. Déployer Transmute (overlay local) :

```bash
docker compose -f docker-compose.yml -f docker-compose.transmute.yml up -d
```

2. Ouvrir `http://localhost:3313`, créer le premier compte admin, générer une **API key**.

3. Renseigner côté backend :

```env
TRANSMUTE_BASE_URL=http://localhost:3313
TRANSMUTE_API_KEY=tm_xxxxxxxx
```

En Docker Compose avec le service `transmute` sur le même réseau :

```env
TRANSMUTE_BASE_URL=http://transmute:3313
TRANSMUTE_API_KEY=tm_xxxxxxxx
```

Dès que les deux variables sont présentes, `GET /api/config` renvoie `transmuteEnabled: true` et l’outil **File Converter** apparaît.

## API DevToolbox

Toutes les routes exigent un JWT DevToolbox.

| Méthode | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/transmute/status` | Santé / reachability |
| `POST` | `/api/transmute/files` | Upload multipart (`file`) |
| `POST` | `/api/transmute/conversions` | `{ fileId, outputFormat }` |
| `GET` | `/api/transmute/files/:id/download` | Binaire converti |

La clé Transmute ne quitte jamais le serveur.

## Smoke test

Contre une stack déjà configurée :

```bash
DEVTOOLBOX_EMAIL=you@example.com DEVTOOLBOX_PASSWORD=secret \
SMOKE_IMAGE=./photo.jpg SMOKE_DOC=./notes.md \
./scripts/smoke-transmute.sh
```

## Spec

Voir [file-converter-transmute-design.md](./file-converter-transmute-design.md).
