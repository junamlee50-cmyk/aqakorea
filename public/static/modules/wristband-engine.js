(function(root){
  'use strict';
  const uuid=()=>root.crypto.randomUUID();
  class DeskEngine{
    constructor(api,bridge,storage,changed=()=>{}){Object.assign(this,{api,bridge,storage,changed});this.busy=false;this.job=null;}
    async scan(scan,settings){
      if(this.busy)throw Error('앞선 발권을 처리하고 있습니다. 잠시 기다려 주세요.');
      this.busy=true;
      try{
        // 서버 응답 유실 후에도 동일 키로 조회되도록 전송 전에 저장한다.
        const signature=JSON.stringify({scan:scan.trim(),...settings});
        let request=JSON.parse(this.storage.getItem('amk-issue-request')||'null');
        if(!request || request.signature!==signature) request={signature,key:uuid()};
        this.storage.setItem('amk-issue-request',JSON.stringify(request));
        this.job=await this.api('/jobs',{...settings,scan,requestKey:request.key});this.changed(this.job);
        if(this.job.duplicate)return {duplicate:true,job:this.job};
        await this._send();return {duplicate:false,job:this.job};
      }finally{this.busy=false;}
    }
    async resume(){
      if(this.busy)throw Error('발권 처리 중입니다.');this.busy=true;
      try{this.job=await this.api('/jobs/'+this.job.id);await this._send();return this.job;}finally{this.busy=false;}
    }
    async _send(){
      const job=this.job;
      for(const item of job.items){
        if(!item.current || item.state!=='queued')continue;
        // 미연결/잘못 선택된 프린터면 dispatch 전 중단하여 queued 상태 유지.
        if(job.config.transport==='bridge')await this.bridge.preflight(job.printerName);
        const prefix=`/jobs/${job.id}/items/${item.id}`;
        const claim=await this.api(prefix+'/dispatch',{stationId:job.stationId});
        this.job=claim.job;this.changed(this.job);if(!claim.permitted)continue;
        let result;
        try{
          result=job.config.transport==='simulation'?{state:'simulated',detail:'모의 출력 (프린터 미사용)'}:
            await this.bridge.print({attemptId:item.id,printerName:job.printerName,person:item.person,config:job.config});
        }catch(e){result={state:'unknown',detail:e.message||'전송 결과 확인 불가'};}
        if(!['accepted','simulated','failed','unknown'].includes(result.state)) result={state:'unknown',detail:'알 수 없는 인쇄 응답'};
        // 보고가 끊기면 다음 인원도 멈춘다. 새로고침/재스캔은 재전송하지 않는다.
        this.storage.setItem('amk-issue-pending-result',JSON.stringify({jobId:job.id,itemId:item.id,result}));
        this.job=await this.api(prefix+'/result',result);this.storage.removeItem('amk-issue-pending-result');this.changed(this.job);
        if(['unknown','failed'].includes(result.state))break;
      }
    }
    async sync(){
      const p=JSON.parse(this.storage.getItem('amk-issue-pending-result')||'null');
      if(p){this.job=await this.api(`/jobs/${p.jobId}/items/${p.itemId}/result`,p.result);this.storage.removeItem('amk-issue-pending-result');this.changed(this.job);}
      return this.job;
    }
    async reprint(itemId,settings,reason){
      if(this.busy)throw Error('발권 처리 중입니다.');this.busy=true;
      try{
        const keyName='amk-reprint-request';
        const signature=JSON.stringify({jobId:this.job.id,itemId,settings,reason});
        let pending=JSON.parse(this.storage.getItem(keyName)||'null');
        if(!pending || pending.signature!==signature)pending={signature,key:uuid()};
        this.storage.setItem(keyName,JSON.stringify(pending));
        this.job=await this.api(`/jobs/${this.job.id}/items/${itemId}/reprint`,{...settings,reason,queueChecked:true,requestKey:pending.key});
        this.changed(this.job);if(!this.job.duplicate)await this._send();return this.job;
      }finally{this.busy=false;}
    }
  }
  root.WristbandEngine=DeskEngine;if(typeof module!=='undefined')module.exports=DeskEngine;
})(typeof globalThis!=='undefined'?globalThis:this);
