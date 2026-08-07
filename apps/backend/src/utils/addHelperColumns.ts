import type { FinStateSecColWHelp, FinStateSecRowWHelp, FinStateSectionCol, FinStateSectionRow } from "@budgets_municipaux/common";
import { addColLevelEditFlagFields, addRowLevelEditFlagFields } from "./addLevelEditFlagFields";
import { addColMoveFlagField, addRowMoveFlagField } from "./addMoveFlagFIelds";
import { addColNextSibling, addColPrevSibling, addColSiblings, addRowNextSibling, addRowPrevSibling, addRowSiblings } from "./addSiblingsRows";

export function addRowHelperColumns(cleanRows:FinStateSectionRow[]):FinStateSecRowWHelp[]{
    const inter1=addRowLevelEditFlagFields(cleanRows)
    const inter2=addRowSiblings(inter1)
    const addMoveFlag=addRowMoveFlagField(inter2)
    return addMoveFlag
}




export function addColHelperColumns(cleanCols:FinStateSectionCol[]):FinStateSecColWHelp[]{
    const inter1=addColLevelEditFlagFields(cleanCols)
    const inter2=addColSiblings(inter1)
    const addMoveFlag=addColMoveFlagField(inter2)
    return addMoveFlag
}

