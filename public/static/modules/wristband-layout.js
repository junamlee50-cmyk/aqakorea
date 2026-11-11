/* 250×25mm 선인쇄 팔찌 위에 출력하는 검정 가변 정보. QR/로고/색면 재인쇄 없음. */
(function(root){
  'use strict';
  const labels={adult:'성인',teen:'청소년',child:'소아'};
  function validate(c){
    if(c.layout!=='buyeo-v1' || ![203,300].includes(c.dpi) || ![0,180].includes(c.rotation) ||
       !Number.isFinite(c.offsetX) || Math.abs(c.offsetX)>5 || !Number.isFinite(c.offsetY) || Math.abs(c.offsetY)>3) throw Error('인쇄 보정값이 올바르지 않습니다.');
  }
  function commands(p,c){
    validate(c);
    if(!labels[p.type]) throw Error('지원하지 않는 권종입니다.');
    const text=[];
    if(p.testMode) text.push({text:'시험용 · 탑승 불가',x:168,y:3,size:1.9,max:53});
    text.push({text:p.time,x:168,y:9.4,size:5.4,max:17,bold:true});
    text.push({text:'출발',x:185.5,y:9.4,size:3.2,max:15,bold:true});
    text.push({text:p.name||'',x:168,y:15.2,size:4.3,max:32,bold:true});
    text.push({text:String(p.date).replace(/-/g,'.'),x:203,y:15.2,size:3.1,max:18});
    text.push({text:'예약 '+p.reservationNo,x:168,y:21,size:2.9,max:43});
    text.push({text:`#${p.sequence}/${p.total}`,x:214,y:21,size:3.2,max:8,bold:true});
    return {width:250,height:25,clip:{x:25,y:1,width:200,height:23},offsetX:c.offsetX,offsetY:c.offsetY,
      tick:{x:{adult:98.5,teen:128.5,child:154.5}[p.type],y:9.25},text};
  }
  function render(p,c,documentRef=root.document){
    const plan=commands(p,c), scale=c.dpi/25.4, canvas=documentRef.createElement('canvas');
    canvas.width=Math.round(250*scale);canvas.height=Math.round(25*scale);
    const g=canvas.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,canvas.width,canvas.height);
    g.scale(scale,scale);g.save();g.beginPath();g.rect(25,1,200,23);g.clip();g.translate(c.offsetX,c.offsetY);
    g.strokeStyle='#000';g.lineWidth=0.7;g.lineCap='round';g.beginPath();
    g.moveTo(plan.tick.x+1,plan.tick.y+3);g.lineTo(plan.tick.x+2.6,plan.tick.y+5);g.lineTo(plan.tick.x+5.5,plan.tick.y+1);g.stroke();
    g.fillStyle='#000';g.textBaseline='alphabetic';
    for(const t of plan.text){
      let size=t.size;
      const font=()=>`${t.bold?'700':'500'} ${size}px "Malgun Gothic","Noto Sans KR",sans-serif`;
      g.font=font();while(g.measureText(t.text).width>t.max && size>1.5){size-=0.1;g.font=font();}
      let str=t.text;while(g.measureText(str).width>t.max && str.length>1) str=str.slice(0,-2)+'…';
      g.fillText(str,t.x,t.y);
    }
    g.restore();return canvas;
  }
  function portrait(p,c,doc=root.document){
    const wide=render(p,c,doc), out=doc.createElement('canvas');out.width=wide.height;out.height=wide.width;
    const g=out.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,out.width,out.height);
    if(c.rotation===180){g.translate(0,out.height);g.rotate(-Math.PI/2);}else{g.translate(out.width,0);g.rotate(Math.PI/2);}
    g.drawImage(wide,0,0);return out;
  }
  const api={validate,commands,render,portrait,labels};root.WristbandLayout=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
