import React, { JSX, useState } from "react";
import { Tree, TreeNode } from "react-organizational-chart";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "./DialogComponents";

type ExpressionNode = {
    func: string;
    args: (ExpressionNode | string | number)[];
};

const parseExpression = (str: string): ExpressionNode => {
    // Remove outer Expression wrapper if present
    str = str.replace(/^Expression\((.*)\)$/, "$1");
    
    const regex = /([A-Za-z]+)\((.*)\)/;
    let match = regex.exec(str);
    
    if (!match) {
        // Handle numeric constants
        if (!isNaN(Number(str))) {
            return { func: "Constant", args: [Number(str)] };
        }
        return { func: str, args: [] };
    }
    
    let [, func, args] = match;
    let parsedArgs: (ExpressionNode | string | number)[] = [];
    let depth = 0;
    let buffer = "";
    
    for (let char of args) {
        if (char === "(") depth++;
        else if (char === ")") depth--;
        else if (char === "," && depth === 0) {
            if (buffer.trim()) {
                parsedArgs.push(parseArg(buffer.trim()));
            }
            buffer = "";
            continue;
        }
        buffer += char;
    }
    
    if (buffer.trim()) {
        parsedArgs.push(parseArg(buffer.trim()));
    }
    
    return { func, args: parsedArgs };
};

const parseArg = (arg: string): ExpressionNode | string | number => {
    if (arg.includes("(")) {
        return parseExpression(arg);
    }
    // Try to parse as number
    const num = Number(arg);
    if (!isNaN(num)) {
        return num;
    }
    return arg;
};

const evaluateNode = (node: ExpressionNode | string | number): number => {
    if (typeof node === "number") {
        return node;
    }
    
    if (typeof node === "object" && "func" in node) {
        switch (node.func) {
            case "Constant":
                return Number(node.args[0]);
            case "UnaryOp":
                return -evaluateNode(node.args[1]);
            case "BinOp":
                const operands = node.args.filter(arg => 
                    typeof arg === "object" && 
                    (!("func" in arg) || !["Add", "Mult", "USub", "Sub"].includes(arg.func))
                );
                const operator = node.args.find(arg => 
                    typeof arg === "object" && 
                    "func" in arg && 
                    ["Add", "Mult", "USub", "Sub"].includes(arg.func)
                ) as ExpressionNode;
                
                if (operator && operands.length === 2) {
                    const left = evaluateNode(operands[0]);
                    const right = evaluateNode(operands[1]);
                    
                    switch (operator.func) {
                        case "Add":
                            return left + right;
                        case "Mult":
                            return left * right;
                        case "Sub":
                            return left - right;
                        default:
                            return 0;
                    }
                }
        }
    }
    return 0;
};

const OperatorButton: React.FC<{
    operator: string;
    node: ExpressionNode;
}> = ({ operator, node }) => {
    const [isOpen, setIsOpen] = useState(false);
    const result = evaluateNode(node);

    const operands = node.args.filter(arg =>
        typeof arg === "object" &&
        (!("func" in arg) || !["Add", "Mult", "USub", "Sub"].includes(arg.func))
    );

    const leftValue = evaluateNode(operands[0]);
    const rightValue = operands[1] ? evaluateNode(operands[1]) : null;

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="min-w-8 h-8 px-2"
                onClick={() => setIsOpen(prev => !prev)}
            >
                {operator}
            </Button>

            {isOpen && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Operation Result</DialogTitle>
                        </DialogHeader>
                        <div className="p-4 space-y-4">
                            <div className="text-lg font-mono">
                                {rightValue !== null ? (
                                    <>
                                        Actual Value: {leftValue} {operator} {rightValue} = {result}
                                        Calculated Value: 
                                    </>
                                ) : (
                                    <>
                                        {operator}{leftValue} = {result}
                                    </>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

const getOperatorSymbol = (func: string, args: (ExpressionNode | string | number)[]): string => {
    switch (func) {
        case "Add":
            return "+";
        case "Mult":
            return "×";
        case "USub":
            return "-";
        case "Sub":
            return "-";
        case "Div":
            return "/";
        case "Constant":
            return args[0].toString();
        case "UnaryOp":
            return "-";
        case "BinOp":
            const operator = args.find(arg => 
                typeof arg === "object" && 
                "func" in arg && 
                ["Add", "Mult", "USub", "Sub", "Div"].includes(arg.func)
            ) as ExpressionNode;
            return operator ? getOperatorSymbol(operator.func, operator.args) : "?";
        default:
            return func;
    }
};

const buildTree = (node: ExpressionNode | string | number): JSX.Element => {
    if (typeof node === "string" || typeof node === "number") {
        return <TreeNode label={node.toString()} />;
    }
    
    if (node.func === "Constant") {
        return <TreeNode label={getOperatorSymbol(node.func, node.args)} />;
    }
    
    if (node.func === "UnaryOp") {
        const constantArg = node.args.find(arg => 
            typeof arg === "object" && 
            "func" in arg && 
            arg.func === "Constant"
        ) as ExpressionNode;
        
        return (
            <TreeNode label={
                <OperatorButton operator="-" node={node} />
            }>
                {constantArg && <TreeNode label={getOperatorSymbol(constantArg.func, constantArg.args)} />}
            </TreeNode>
        );
    }
    
    if (node.func === "BinOp") {
        const operands = node.args.filter(arg => 
            typeof arg === "object" && 
            (!("func" in arg) || !["Add", "Mult", "USub", "Sub", "Div"].includes(arg.func))
        );
        
        return (
            <TreeNode label={
                <OperatorButton 
                    operator={getOperatorSymbol(node.func, node.args)} 
                    node={node} 
                />
            }>
                {operands.map((arg, index) => (
                    <React.Fragment key={index}>
                        {buildTree(arg)}
                    </React.Fragment>
                ))}
            </TreeNode>
        );
    }
    
    return (
        <TreeNode label={getOperatorSymbol(node.func, node.args)}>
            {node.args.map((arg, index) => (
                <React.Fragment key={index}>
                    {buildTree(arg)}
                </React.Fragment>
            ))}
        </TreeNode>
    );
};

interface ExpressionTreeProps {
    expression: string;
}

const ExpressionTree: React.FC<ExpressionTreeProps> = ({ expression }) => {
    const parsedTree = parseExpression(expression);
    
    return (
        <div className="flex justify-center mt-8">
            <Tree
                label={<div className="font-bold">Expression</div>}
                lineWidth="2px"
                lineColor="#666"
                lineBorderRadius="10px"
            >
                {buildTree(parsedTree)}
            </Tree>
        </div>
    );
};

export default ExpressionTree;