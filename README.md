# manga-mochi

This is just a place to dump a code for downloading manga based on trial-and-error approach.

If you need any manga site to be supported, please open an issue.

## Requirement

|      | version |
| :--: | :-----: |
| node |  >=20  |

## Usage

```bash
$ npm install
```

Then

```bash
$  node main.mjs <<url>>
```

## Notes

- One of the dependencies is [node-canvas](https://github.com/Automattic/node-canvas) which may requires some additional setup. Check the doc for more details.

## Support Sites

| Mangaone | [https://manga-one.com/](https://manga-one.com/) |
| -------- | --------------------------------------------- |

- Mangaone: in-memory page + encrypted AES
- ichicomi: normal fetch + gigaviewer scramble (transpose)
- takecomic: viewer id + fetch img url + scramble pattern COMICI

## Contribute

Any pull request is welcome. But credentials are required to use most manga sites, so it might be impossible for me to test them. I'll trust you that it works.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```
