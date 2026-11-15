# Fixture: Cine Tapioca

Cópia versionada do projeto Delphi real Cine Tapioca, usada nos testes do
parser e do índice de chamadas do Caller Graph.

- Origem: https://github.com/alan1tavares/cine-tapioca
- Commit: `2b63d921dca6110b6936c6c6d0a47749ab79f55a` (2018-11-23)
- Arquivos copiados: `CineTapioca.dpr`, os 14 `.pas` e os 13 `.dfm` (texto,
  VCL). Ficaram de fora `CineTapioca.dproj`, `CineTapioca.res` e o
  `README.md` original.
- Os arquivos estão byte a byte como no repositório de origem; alguns `.pas`
  estão em Windows-1252, como é comum em projetos Delphi.

É uma cópia, e não um submódulo ou clone feito no teste, para manter a suíte
offline e determinística. Não edite estes arquivos: se o projeto de origem
mudar, copie de novo e atualize o commit acima.
