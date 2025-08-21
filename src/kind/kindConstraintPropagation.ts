import {
    TypeChecker,
    TypeParameterDeclaration,
    Type,
    Symbol,
    Node,
    SourceFile,
    TypeReferenceNode,
    SyntaxKind,
} from "../types2";
import { KindMetadata, KindSource } from "./kindMetadata.js";
import { compareKinds } from "./kindComparison.js";
import { __KindBrand, __HKIn, __HKOut } from "../../kind-branding";

/**
 * Kind constraint information for a type parameter
 */
export interface KindConstraint {
    typeParameterName: string;
    expectedKind: KindMetadata;
    constraintNode: TypeParameterDeclaration;
    sourceFile: SourceFile;
}

/**
 * Constraint map keyed by type parameter name
 */
export class KindConstraintMap {
    private constraints = new Map<string, KindConstraint>();
    private dependentConstraints = new Map<string, string[]>(); // parent -> children

    /**
     * Add a kind constraint for a type parameter
     */
    addConstraint(
        typeParameterName: string,
        expectedKind: KindMetadata,
        constraintNode: TypeParameterDeclaration,
        sourceFile: SourceFile
    ): void {
        this.constraints.set(typeParameterName, {
            typeParameterName,
            expectedKind,
            constraintNode,
            sourceFile
        });
    }

    /**
     * Get a kind constraint for a type parameter
     */
    getConstraint(typeParameterName: string): KindConstraint | undefined {
        return this.constraints.get(typeParameterName);
    }

    /**
     * Check if a type parameter has a kind constraint
     */
    hasConstraint(typeParameterName: string): boolean {
        return this.constraints.has(typeParameterName);
    }

    /**
     * Add a dependent relationship between type parameters
     */
    addDependency(parentName: string, childName: string): void {
        if (!this.dependentConstraints.has(parentName)) {
            this.dependentConstraints.set(parentName, []);
        }
        this.dependentConstraints.get(parentName)!.push(childName);
    }

    /**
     * Get all dependent type parameters for a given parent
     */
    getDependents(parentName: string): string[] {
        return this.dependentConstraints.get(parentName) || [];
    }

    /**
     * Clear all constraints
     */
    clear(): void {
        this.constraints.clear();
        this.dependentConstraints.clear();
    }

    /**
     * Get all constraint names
     */
    getConstraintNames(): string[] {
        return Array.from(this.constraints.keys());
    }
}

/**
 * Global constraint map instance
 */
export const globalKindConstraintMap = new KindConstraintMap();

/**
 * Identify type parameters with explicit kind constraints
 */
export function identifyKindConstraints(
    typeParameters: readonly TypeParameterDeclaration[],
    checker: TypeChecker,
    sourceFile: SourceFile
): void {
    for (const typeParam of typeParameters) {
        if (!typeParam.constraint) continue;

        // Check if the constraint is a Kind<...> type
        if (isKindConstraint(typeParam.constraint, checker)) {
            const kindMetadata = extractKindFromConstraint(typeParam.constraint, checker);
            if (kindMetadata) {
                globalKindConstraintMap.addConstraint(
                    typeParam.name.escapedText,
                    kindMetadata,
                    typeParam,
                    sourceFile
                );
            }
        }
    }
}

/**
 * Check if a type node is a kind constraint
 */
function isKindConstraint(typeNode: Node, checker: TypeChecker): boolean {
    if (isTypeReferenceNode(typeNode)) {
        const typeName = typeNode.typeName;
        if (isIdentifier(typeName) && typeName.escapedText === "Kind") {
            return true;
        }
    }
    return false;
}

/**
 * Extract kind metadata from a constraint type node
 */
function extractKindFromConstraint(
    constraintNode: Node,
    checker: TypeChecker
): KindMetadata | undefined {
    if (!isTypeReferenceNode(constraintNode)) {
        return undefined;
    }

    // Get the type from the constraint node
    const constraintType = checker.getTypeFromTypeNode(constraintNode);
    if (!constraintType) {
        return undefined;
    }

    // Check if it's a KindType
    if (constraintType.flags & 0x80000000) { // TypeFlags.Kind
        return {
            arity: (constraintType as any).kindArity || 0,
            parameterKinds: (constraintType as any).parameterKinds || [],
            symbol: (constraintType.symbol as any),
            retrievedFrom: KindSource.None,
            isValid: true
        };
    }

    return undefined;
}

/**
 * Simple kind constraint validation
 */
export function validateKindConstraint(
    typeParameterName: string,
    actualKind: KindMetadata,
    checker: TypeChecker
): { isValid: boolean; errors: string[] } {
    const constraint = globalKindConstraintMap.getConstraint(typeParameterName);
    if (!constraint) {
        return { isValid: true, errors: [] };
    }

    const comparison = compareKinds(constraint.expectedKind, actualKind, checker, false);
    return {
        isValid: comparison.isCompatible,
        errors: comparison.errors?.map(e => e.message) || []
    };
}

// Helper functions
function isTypeReferenceNode(node: Node): node is TypeReferenceNode {
    return node.kind === SyntaxKind.TypeReference;
}

function isIdentifier(node: Node): node is any {
    return node.kind === SyntaxKind.Identifier;
}