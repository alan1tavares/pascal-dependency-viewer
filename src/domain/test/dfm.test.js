import { parseForm, formPaths, isBinaryForm } from '../callIndex/dfm.js';
import { indexProject, isEntryPoint, callersOf } from './support/memoryProject.js';

const FORM_TEXT = `object Form1: TForm1
  Caption = 'Teste'
  OnCreate = FormCreate
  object Panel1: TPanel
    object Button1: TButton
      Caption = 'OK'
      OnClick = Button1Click
    end
    object DBGrid1: TDBGrid
      Columns = <
        item
          FieldName = 'NOME'
        end
        item
          FieldName = 'ID'
        end>
      OnDblClick = GridDblClick
    end
  end
  inline Frame1: TFrame1
    OnEnter = FrameEnter
  end
end`;

test('handlers no objeto raiz, em componentes aninhados, depois de coleções e em inline', () => {
  const form = parseForm(FORM_TEXT);
  expect(form).toMatchObject({ binary: false, rootName: 'Form1', rootClass: 'TForm1' });
  expect(form.handlers).toEqual([
    { component: 'Form1', event: 'OnCreate', handler: 'FormCreate' },
    { component: 'Button1', event: 'OnClick', handler: 'Button1Click' },
    { component: 'DBGrid1', event: 'OnDblClick', handler: 'GridDblClick' },
    { component: 'Frame1', event: 'OnEnter', handler: 'FrameEnter' },
  ]);
});

test('eventos sem prefixo On (datasets) e referências a componentes', () => {
  const form = parseForm(`object fm: Tfm
  object qrDados: TFDQuery
    BeforePost = qrDadosBeforePost
    Active = True
  end
  object Label1: TLabel
    FocusControl = edNome
  end
end`);
  expect(form.handlers.map((h) => h.handler)).toEqual(['qrDadosBeforePost', 'edNome']);
});

test('formulário herdado (inherited) e CRLF', () => {
  const form = parseForm('inherited fmFilho: TfmFilho\r\n  inherited Botao: TButton\r\n    OnClick = BotaoClick\r\n  end\r\nend\r\n');
  expect(form.rootClass).toBe('TfmFilho');
  expect(form.handlers.map((h) => h.handler)).toEqual(['BotaoClick']);
});

test('formulário binário é detectado e não tem handlers', () => {
  const binary = 'TPF0\u000bTFormLegado\nFormLegado\u0006OnShow\u0007\u0008FormShow\u0000';
  expect(isBinaryForm(binary)).toBe(true);
  expect(isBinaryForm('�\n\u0000TFORM1')).toBe(true);
  expect(parseForm(binary)).toEqual({ binary: true, rootName: null, rootClass: null, handlers: [] });
});

test('caminho do formulário a partir das diretivas {$R}', () => {
  expect(formPaths('Unit1.pas', ['*.dfm'])).toEqual(['Unit1.dfm']);
  expect(formPaths('forms/Unit1.pas', ['*.fmx', '*.res'])).toEqual(['forms/Unit1.fmx']);
  expect(formPaths('forms\\Unit1.pas', ['Outro.dfm'])).toEqual(['forms\\Outro.dfm']);
  expect(formPaths('Unit1.pas', ['*.res'])).toEqual([]);
});

const UNIT1 = `unit Unit1;
interface
type
  TForm1 = class(TForm)
    procedure Button1Click(Sender: TObject);
    procedure Atalho;
  end;
implementation
{$R *.dfm}
procedure TForm1.Button1Click(Sender: TObject); begin end;
procedure TForm1.Atalho; begin Button1Click(nil); end;
end.`;

test('handler ligado no .dfm é Entry Point e continua podendo ter Callers', async () => {
  const { index } = await indexProject({ Unit1: UNIT1 }, {
    files: { 'Unit1.dfm': 'object Form1: TForm1\n  object Button1: TButton\n    OnClick = Button1Click\n  end\nend\n' },
  });
  expect(isEntryPoint(index, 'TForm1.Button1Click')).toBe(true);
  expect(isEntryPoint(index, 'TForm1.Atalho')).toBe(false);
  expect(callersOf(index, 'TForm1.Button1Click')).toEqual(['TForm1.Atalho']);
});

test('.dfm binário ou ausente não marca Entry Point nem pula a Unit', async () => {
  for (const files of [{ 'Unit1.dfm': 'TPF0\u0006TForm1\u0000OnClick\u0007Button1Click' }, {}]) {
    const { index } = await indexProject({ Unit1: UNIT1 }, { files });
    expect(isEntryPoint(index, 'TForm1.Button1Click')).toBe(false);
    expect(index.skippedUnits).toEqual([]);
    expect(index.units[0].methods).toHaveLength(2);
  }
});

const BASE_FORM = `unit UBase;
interface
type
  TfmBase = class(TForm)
    Label1: TLabel;
    procedure FormShow(Sender: TObject);
    procedure qrDadosBeforePost(DataSet: TDataSet);
  end;
implementation
{$R *.dfm}
procedure TfmBase.FormShow(Sender: TObject); begin end;
procedure TfmBase.qrDadosBeforePost(DataSet: TDataSet); begin end;
end.`;

const CHILD_FORM = `unit UFilho;
interface
uses UBase;
type
  TfmFilho = class(TfmBase)
    procedure FormShow(Sender: TObject);
    procedure Outro;
  end;
implementation
{$R *.dfm}
procedure TfmFilho.FormShow(Sender: TObject); begin inherited; end;
procedure TfmFilho.Outro; begin end;
end.`;

test('handlers do formulário ancestral valem para o herdado, resolvidos na classe filha', async () => {
  const { index } = await indexProject({ UBase: BASE_FORM, UFilho: CHILD_FORM }, {
    files: {
      'UBase.dfm': 'object fmBase: TfmBase\n  OnShow = FormShow\n  object qrDados: TFDQuery\n    BeforePost = qrDadosBeforePost\n  end\n  object Label1: TLabel\n    FocusControl = Label1\n  end\nend\n',
      'UFilho.dfm': 'inherited fmFilho: TfmFilho\nend\n',
    },
  });
  expect(isEntryPoint(index, 'TfmBase.FormShow')).toBe(true);
  expect(isEntryPoint(index, 'TfmBase.qrDadosBeforePost')).toBe(true);
  expect(isEntryPoint(index, 'TfmFilho.FormShow')).toBe(true);
  expect(isEntryPoint(index, 'TfmFilho.Outro')).toBe(false);
  expect(callersOf(index, 'TfmBase.FormShow')).toEqual(['TfmFilho.FormShow']);
});
