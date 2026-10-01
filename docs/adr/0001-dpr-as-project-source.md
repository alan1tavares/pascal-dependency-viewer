# Usar o arquivo `.dpr`, e não o `.dproj`, como fonte do Project

Para adicionar uma funcionalidade de "carregar um projeto Delphi", precisávamos
de um único artefato do qual derivar a lista das units próprias do projeto.
Escolhemos o arquivo `.dpr`: sua cláusula `uses` já lista cada unit junto com
o caminho do seu arquivo (`UnitA in 'UnitA.pas'`), fornecendo um mapeamento
direto unit → arquivo por meio do mesmo parsing leve via regex que este
código já usa para arquivos `.pas` avulsos. Consideramos o `.dproj` (o arquivo
XML de projeto que as IDEs apresentam como "o projeto"), mas ele exigiria
parsing de XML e não mapeia tão diretamente para os arquivos-fonte; também
consideramos varrer a pasta do projeto em busca de arquivos `.pas`, mas isso
não consegue distinguir as units do projeto de arquivos não relacionados que
estejam na mesma pasta. O `.groupproj` (grupos de múltiplos projetos) está
totalmente fora do escopo — apenas um único `.dpr` é suportado como Project.
