// Always hit-test against the original layout. The dragged card's moving
// rectangle follows the finger and would otherwise always win its own hit-test.
export function dropTarget(boxes:any[],x:number,y:number){return boxes.reduce((best:number,r:any,i:number)=>{
 const distance=(b:any)=>Math.hypot(x-(b.left+b.width/2),y-(b.top+b.height/2));
 return distance(r)<distance(boxes[best])?i:best;
},0);}
