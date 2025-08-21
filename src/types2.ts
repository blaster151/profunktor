// Minimal compiler-like types to decouple kind-system from the massive src/types.ts

export enum SyntaxKind {
	Identifier = 0,
	TypeReference = 1,
	InterfaceDeclaration = 2,
	ClassDeclaration = 3,
	TypeAliasDeclaration = 4,
	FunctionDeclaration = 5,
	MethodDeclaration = 6,
	FunctionExpression = 7,
	ArrowFunction = 8,
	PropertySignature = 9,
	MethodSignature = 10,
	Constructor = 11,
	TypeParameter = 12,
	KindType = 13,
	CallExpression = 14,
	NewExpression = 15,
	MappedType = 16,
	ConditionalType = 17,
	FunctionType = 18,
	PropertyAccessExpression = 19,
}

export const enum NodeFlags {
	TypeCached = 1 << 0,
	InExtendsConstraintContext = 1 << 1,
	InMappedTypeContext = 1 << 2,
}

export const enum TypeFlags {
	Any = 1 << 0,
	Unknown = 1 << 1,
	String = 1 << 2,
	Number = 1 << 3,
	Boolean = 1 << 4,
	BigInt = 1 << 5,
	Symbol = 1 << 6,
	Null = 1 << 7,
	Undefined = 1 << 8,
	Object = 1 << 9,
	Union = 1 << 10,
	Intersection = 1 << 11,
	Function = 1 << 12,
	Array = 1 << 13,
	Tuple = 1 << 14,
	Kind = 1 << 31,
}

export const enum SymbolFlags {
	None = 0,
	Function = 1 << 0,
	Class = 1 << 1,
	Interface = 1 << 2,
	TypeAlias = 1 << 3,
	Module = 1 << 4,
	Alias = 1 << 5,
	Transient = 1 << 6,
}

export interface SourceFile {
	fileName: string;
	getLineAndCharacterOfPosition?(pos: number): LineAndCharacter;
}

export interface Node {
	kind: SyntaxKind | number;
	parent?: Node;
	flags?: number;
	pos: number;
	getSourceFile(): SourceFile;
	getStart?(sf?: SourceFile): number;
	getWidth?(sf?: SourceFile): number;
	getChildren?(): Node[];
}

export interface Type { flags: number; symbol?: Symbol; }

export interface Declaration extends Node {}

export interface Symbol {
	flags?: number;
	name?: string;
	declarations?: readonly Declaration[];
}

export interface TypeChecker {
	getTypeFromTypeNode(node: TypeNode): Type;
	getTypeAtLocation(node: Node): Type;
	getSymbolAtLocation(node: Node): Symbol | undefined;
	isTypeAssignableTo(a: Type, b: Type): boolean;
	getTypeOfSymbolAtLocation?(symbol: Symbol, node: Node): Type;
}

export interface Program {}

export interface Identifier extends Node { escapedText: any; getText?(): string; }
export type EntityName = Identifier;

export interface TypeNode extends Node {}
export interface TypeReferenceNode extends TypeNode {
	typeName: EntityName | any;
	typeArguments?: readonly TypeNode[];
}
export interface MappedTypeNode extends TypeNode { constraintType?: TypeNode; }
export interface ConditionalTypeNode extends TypeNode { checkType: TypeNode; extendsType: TypeNode; }
export interface InferTypeNode extends TypeNode { constraintType?: TypeNode; defaultType?: TypeNode }
export interface FunctionTypeNode extends TypeNode { typeParameters?: readonly TypeParameterDeclaration[] }

export interface TypeParameterDeclaration extends Node {
	name: Identifier;
	constraint?: TypeNode;
	jsDoc?: readonly any[];
}

export interface CallExpression extends Node {
	expression: Node;
	typeArguments?: readonly TypeNode[];
}
export interface NewExpression extends CallExpression {}

export interface TypeAliasDeclaration extends Node { typeParameters?: readonly TypeParameterDeclaration[]; }
export interface InterfaceDeclaration extends Node { typeParameters?: readonly TypeParameterDeclaration[]; members?: readonly Node[]; heritageClauses?: readonly any[]; }
export interface ClassDeclaration extends Node { typeParameters?: readonly TypeParameterDeclaration[]; members?: readonly Node[]; }

export interface DiagnosticWithLocation {
	file: SourceFile;
	start: number;
	length: number;
	messageText: string | { key: string; category: string; code: number; arguments?: string[] };
	category: DiagnosticCategory | number | string;
	code: number;
	// convenience fields sometimes attached by our code
	line?: number;
	column?: number;
	reportsUnnecessary?: boolean;
	reportsDeprecated?: boolean;
	source?: string;
}

export interface LineAndCharacter { line: number; character: number; }

export interface KindType extends Type { arity?: number; parameterKinds?: readonly Type[]; }
export interface KindTypeNode extends TypeNode { typeName: EntityName | any; typeArguments?: readonly TypeNode[]; }

export const enum ObjectFlags { None = 0 }
export interface TypeConstructorType extends Type {}

export const enum DiagnosticCategory {
	Warning = 0,
	Error = 1,
	Suggestion = 2,
	Message = 3,
}

// Optional helper type the code references
export type HeritageClause = any;


