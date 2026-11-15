// Stubs da RTL (design D10): fontes Pascal só com declarações, analisados
// pelo mesmo parser e pela mesma passada de declarações que as Project Units.
// Bastam para resolver indexadores, enumeradores (`for..in`) e retornos dos
// containers mais usados; nenhum deles tem corpo, então nunca viram Methods.

const SYSTEM = `unit System;
interface
type
  TObject = class
    constructor Create;
    destructor Destroy; virtual;
    procedure Free;
    function ClassName: string;
  end;
  TClass = class of TObject;
  IInterface = interface
    function _AddRef: Integer;
    function _Release: Integer;
  end;
  IUnknown = IInterface;
  TInterfacedObject = class(TObject, IInterface)
  end;
  TArray<T> = array of T;
implementation
end.`;

const GENERICS_COLLECTIONS = `unit System.Generics.Collections;
interface
type
  TEnumerator<T> = class
    function MoveNext: Boolean;
    property Current: T read GetCurrent;
  end;

  TEnumerable<T> = class
    function GetEnumerator: TEnumerator<T>;
    function ToArray: TArray<T>;
  end;

  TList<T> = class(TEnumerable<T>)
    function Add(const Value: T): Integer;
    procedure AddRange(const Values: array of T);
    procedure Insert(Index: Integer; const Value: T);
    procedure Delete(Index: Integer);
    function Remove(const Value: T): Integer;
    function Extract(const Value: T): T;
    function ExtractAt(Index: Integer): T;
    function First: T;
    function Last: T;
    function IndexOf(const Value: T): Integer;
    function Contains(const Value: T): Boolean;
    procedure Clear;
    procedure Sort;
    function GetEnumerator: TEnumerator<T>;
    property Count: Integer read GetCount write SetCount;
    property Items[Index: Integer]: T read GetItem write SetItem; default;
  end;

  TObjectList<T: class> = class(TList<T>)
    property OwnsObjects: Boolean read GetOwnsObjects write SetOwnsObjects;
  end;

  TPair<TKey, TValue> = record
    Key: TKey;
    Value: TValue;
  end;

  TDictionary<TKey, TValue> = class(TEnumerable<TPair<TKey, TValue>>)
    procedure Add(const Key: TKey; const Value: TValue);
    procedure AddOrSetValue(const Key: TKey; const Value: TValue);
    procedure Remove(const Key: TKey);
    function ExtractPair(const Key: TKey): TPair<TKey, TValue>;
    function TryGetValue(const Key: TKey; out Value: TValue): Boolean;
    function ContainsKey(const Key: TKey): Boolean;
    function ContainsValue(const Value: TValue): Boolean;
    procedure Clear;
    function GetEnumerator: TEnumerator<TPair<TKey, TValue>>;
    property Count: Integer read GetCount;
    property Items[const Key: TKey]: TValue read GetItem write SetItem; default;
    property Keys: TEnumerable<TKey> read GetKeys;
    property Values: TEnumerable<TValue> read GetValues;
  end;

  TObjectDictionary<TKey, TValue> = class(TDictionary<TKey, TValue>)
  end;

  TQueue<T> = class(TEnumerable<T>)
    procedure Enqueue(const Value: T);
    function Dequeue: T;
    function Extract: T;
    function Peek: T;
    procedure Clear;
    function GetEnumerator: TEnumerator<T>;
    property Count: Integer read GetCount;
  end;

  TObjectQueue<T: class> = class(TQueue<T>)
  end;

  TStack<T> = class(TEnumerable<T>)
    procedure Push(const Value: T);
    function Pop: T;
    function Extract: T;
    function Peek: T;
    procedure Clear;
    function GetEnumerator: TEnumerator<T>;
    property Count: Integer read GetCount;
  end;

  TObjectStack<T: class> = class(TStack<T>)
  end;
implementation
end.`;

const CLASSES = `unit System.Classes;
interface
type
  TStringsEnumerator = class
    function MoveNext: Boolean;
    property Current: string read GetCurrent;
  end;

  TStrings = class
    function Add(const S: string): Integer;
    function AddObject(const S: string; AObject: TObject): Integer;
    procedure Delete(Index: Integer);
    function IndexOf(const S: string): Integer;
    procedure Clear;
    function GetEnumerator: TStringsEnumerator;
    property Count: Integer read GetCount;
    property Text: string read GetText write SetText;
    property Objects[Index: Integer]: TObject read GetObject write PutObject;
    property Strings[Index: Integer]: string read Get write Put; default;
  end;

  TStringList = class(TStrings)
    procedure Sort;
    property Sorted: Boolean read FSorted write SetSorted;
  end;
implementation
end.`;

export const RTL_STUBS = Object.freeze([
  { unitName: 'System', source: SYSTEM },
  { unitName: 'System.Generics.Collections', source: GENERICS_COLLECTIONS },
  { unitName: 'System.Classes', source: CLASSES },
]);
