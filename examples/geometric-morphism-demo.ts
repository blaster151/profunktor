import { demoVerifySheafifiableTransfer } from "../fp-computational-topos-framework";
import { demoQuillenPairFromToyGeometricMorphism } from "../fp-homotopy-type-theory-bridge";

const report = demoVerifySheafifiableTransfer();
// eslint-disable-next-line no-console
console.log("Transfer report:", {
  cofibrantlyGenerated: report.axioms.cofibrantlyGenerated,
  twoOfThree: report.axioms.twoOfThree
});

const quillen = demoQuillenPairFromToyGeometricMorphism();
// eslint-disable-next-line no-console
console.log("Quillen adjunction ready:", {
  hasLeft: typeof quillen.left === "function",
  hasRight: typeof quillen.right === "function"
});
