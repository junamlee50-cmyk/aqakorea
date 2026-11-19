/* 250×30mm 선인쇄 팔찌 위에 출력하는 검정 가변 정보. QR/로고/색면 재인쇄 없음. */
(function(root){
  'use strict';
  const labels={adult:'성인',teen:'청소년',child:'소아'};
  function validate(c){
    if(c.layout!=='buyeo-v2-30x250' || ![203,300].includes(c.dpi) || ![0,180].includes(c.rotation) ||
       !Number.isFinite(c.offsetX) || Math.abs(c.offsetX)>5 || !Number.isFinite(c.offsetY) || Math.abs(c.offsetY)>3) throw Error('인쇄 보정값이 올바르지 않습니다.');
  }
  // ── 물리 좌표 기준 ──────────────────────────────────────────────
  // 길이(len): 먼저 배출되는 절취선을 0mm로 잰 실물 길이. 캔버스 x = 250 - len (급지 방향 0° 기준).
  // 예약정보와 권종 체크는 서로 독립된 상수로 맞춘다(전체 보정값으로 한꺼번에 밀지 않는다).
  const BAND_LEN=250;
  const toX=len=>BAND_LEN-len;
  // 예약정보 블록: 실물 흰 여백은 길이 30~83mm. 실측에서 출력이 약 수 mm 밀릴 수 있어 양쪽 여유를 두고 36~77mm에 배치.
  const INFO={startLen:77,endLen:36};
  // 권종 체크 흰 네모의 실물 중심(길이 mm). 청소년 1장 시험으로 확인 예정.
  const TICK_LEN={adult:149,teen:119,child:93};
  const TICK_Y=12.25;           // 체크 중심의 폭 방향 위치(기존 값 유지)
  function commands(p,c){
    validate(c);
    if(!labels[p.type]) throw Error('지원하지 않는 권종입니다.');
    const x0=toX(INFO.startLen), w=INFO.startLen-INFO.endLen;   // 글자는 x0에서 +방향(길이가 줄어드는 쪽)으로 진행
    const text=[];
    if(p.testMode) text.push({text:'시험용 · 탑승 불가',x:x0,y:3,size:1.9,max:w});
    text.push({text:p.time,x:x0,y:9.4,size:5.4,max:15,bold:true});
    text.push({text:'출발',x:x0+16,y:9.4,size:3.2,max:11,bold:true});
    text.push({text:p.name||'',x:x0,y:15.2,size:4.3,max:21,bold:true});
    text.push({text:String(p.date).replace(/-/g,'.'),x:x0+22,y:15.2,size:3.1,max:w-22});
    text.push({text:'예약 '+p.reservationNo,x:x0,y:21,size:2.9,max:w-9});
    text.push({text:`#${p.sequence}/${p.total}`,x:x0+w-8,y:21,size:3.2,max:8,bold:true});
    return {width:250,height:30,clip:{x:25,y:1,width:200,height:28},offsetX:c.offsetX,offsetY:c.offsetY+2.5,
      tick:{cx:toX(TICK_LEN[p.type]),cy:TICK_Y},info:{x0,w,startLen:INFO.startLen,endLen:INFO.endLen},text};
  }
  function render(p,c,documentRef=root.document){
    const plan=commands(p,c), scale=c.dpi/25.4, canvas=documentRef.createElement('canvas');
    canvas.width=Math.round(250*scale);canvas.height=Math.round(30*scale);
    const g=canvas.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,canvas.width,canvas.height);
    g.scale(scale,scale);g.save();g.beginPath();g.rect(plan.clip.x,plan.clip.y,plan.clip.width,plan.clip.height);g.clip();g.translate(plan.offsetX,plan.offsetY);
    g.strokeStyle='#000';g.lineWidth=0.7;g.lineCap='round';g.beginPath();
    g.moveTo(plan.tick.cx-2.25,plan.tick.cy);g.lineTo(plan.tick.cx-0.65,plan.tick.cy+2);g.lineTo(plan.tick.cx+2.25,plan.tick.cy-2);g.stroke();
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
  const api={validate,commands,render,portrait,labels,toX,INFO,TICK_LEN};root.WristbandLayout=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
