import { Component, Input, Output, EventEmitter, HostListener, OnChanges, SimpleChanges} from '@angular/core';
import { HttpClient,  HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { encrypt, decrypt} from '../EncryptDecryptServices';
import { EventAug } from '../JsonServerClass';
import {Bucket_List_Info} from '../JsonServerClass';
import { XMVConfig } from '../JsonServerClass';
import { XMVTestProd } from '../JsonServerClass';
import { LoginIdentif } from '../JsonServerClass';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {

  constructor(
    private router:Router,
    private http: HttpClient,    
    ) {}

    identification=new LoginIdentif; 
    // from xmv-company.cmoponent.ts which got it through an @output action
    // putpose is to keep the identification if user goes to other part of the website so that he/she does not need to reenter the information


    ConfigXMV=new XMVConfig;
    ConfigTestProd=new XMVTestProd;

    id_Animation:Array<number>=[];

    j_loop:Array<number>=[];
    max_j_loop:number=20000;

    @Output() my_output1= new EventEmitter<any>();
    @Output() my_output2= new EventEmitter<string>();
    
    
    myHeader= new  HttpHeaders();
    getScreenWidth: any;
    getScreenHeight: any;
    device_type:string='';
    routing_code:number=0;
    text_error:string='';
    i:number=0;

    myForm = new FormGroup({
      userId: new FormControl(''),
      password: new FormControl(''),
      action: new  FormControl(''),
    });

    Encrypt:string='';
    Decrypt:string='';
    Crypto_Method:string='';
    Crypto_Error:string='';
    Crypto_Key:number=0;
    Encrypt_Data=new LoginIdentif;

    Table_User_Data:Array<EventAug>=[];
    Table_DecryptPSW:Array<string>=[];
    Individual_User_Data= new EventAug;
    bucket_data:string='';

    HTTP_Address:string='';
    HTTP_AddressMetaData:string='';
    Server_Name:string='Google'; // "Google" or "MyJson"
    Google_Bucket_Access_Root:string='https://storage.googleapis.com/storage/v1/b/';
    Google_Bucket_Access_RootPOST:string='https://storage.googleapis.com/upload/storage/v1/b/';
    //Google_Bucket_Name:string='my-db-json';
    Google_Bucket_Name:string='manage-login'; 
    Google_Object_Name:string='';
    Google_Object_Name_Extension:string='.json';
    Bucket_Info_Array=new Bucket_List_Info;

    EventHTTPReceived:Array<boolean>=[];
    FileType={TestProd:''};
  
  @HostListener('window:resize', ['$event'])
  onWindowResize() {
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
    }

  ngOnInit(){
      this.getScreenWidth = window.innerWidth;
      this.getScreenHeight = window.innerHeight;
      this.device_type = navigator.userAgent;
      this.device_type = this.device_type.substring(10, 48);

      this.myHeader=new HttpHeaders({
        'content-type': 'application/json',
        'cache-control': 'private, max-age=0'
      });
      for (let i=0; i<10; i++){
        this.EventHTTPReceived.push(false);
        this.id_Animation.push(0);
        this.j_loop.push(0);
      }
      this.EventHTTPReceived[3]=false;
      this. getConfigAsset();
      // id_animation=3; EventHTTPReceived=3
      this.j_loop[3]=0;
      this.waitHTTP(30000,3,3);
      //this.httpHeader.append('content-type', 'application/json');
      //this.httpHeader.append('Cache-Control', 'no-store, must-revalidate, private, max-age=0, no-transform');
      this.routing_code=0;
      //this.EventHTTPReceived[0]=false;
      //this.getEventAug(0);
      // id_animation=0; EventHTTPReceived=0
      //this.j_loop[0]=0;
      //this.waitHTTP(30000,0,0);
      this.EventHTTPReceived[0]=true;

      
      
      this.identification.UserId='XMVIT-Admin';
      this.identification.key=2;
      this.identification.method='AES';
      this.Crypto_Key=this.identification.key;
      this.Crypto_Method=this.identification.method;
      this.Decrypt='LIM!12monica#Chin';
      this.onCrypt("Encrypt");
      this.identification.psw=this.Encrypt;
    



      if (this.identification.UserId!=='' && this.identification.psw!=='') {
       // go through login panel again to allow the change of user id if needed 
          this.myForm.controls['userId'].setValue(this.identification.UserId);
          this.Crypto_Key=this.identification.key;
          this.Crypto_Method=this.identification.method;
          this.Encrypt=this.identification.psw;
          this.onCrypt("Decrypt");
          this.myForm.controls['password'].setValue(this.Decrypt);
      } else {
          this.myForm.controls['action'].setValue("");
        }

        this.Encrypt_Data=this.identification;

  }

waitHTTP( max_loop:number, id:number,event:number){
    const pas=500;
    if (this.j_loop[event]%pas === 0){
      console.log('waitHTTP ==> loop=', this.j_loop[event], ' max_loop=', max_loop, ' [EventHTTP] ' +event+ '  this.EventHTTPReceived=', this.EventHTTPReceived[event]);
    }
    this.j_loop[event]++
    
    this.id_Animation[id]=window.requestAnimationFrame(() => this.waitHTTP(max_loop, id, event));
    if (this.j_loop[event]>max_loop || this.EventHTTPReceived[event]===true){
              console.log('exit waitHTTP ==> loop=', this.j_loop[event], ' max_loop=', max_loop + ' [EventHTTP]  = ' + event+ 'this.EventHTTPReceived=', this.EventHTTPReceived[event]);
              window.cancelAnimationFrame(this.id_Animation[id]);
              this.routing_code=2;
        }  

    }




getConfig(ObjectName:string, event:number){
  console.log('getConfig() of '+ObjectName + ' [event]' + event + ' '+this.EventHTTPReceived[event]);
  this.EventHTTPReceived[event]=false;
  this.HTTP_Address=this.Google_Bucket_Access_Root +  "config-xmvit/o/" + ObjectName + "?alt=media" ;    
          this.http.get<XMVConfig>(this.HTTP_Address )
            .subscribe((data ) => {
              this.EventHTTPReceived[event]=true;
              console.log('getConfig() - data received '+ ' [event]' + event + ' '+this.EventHTTPReceived[event]);
              this.ConfigXMV=data;
              
            },
              error_handler => {
                console.log('getConfig() - error handler');
                this.text_error='INIT - error message==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
              } 
        )
  }


getConfigAsset(){
    console.log('getConfigAsset()');

    if (environment.production === false){
      this.FileType.TestProd = 'Test';
    }
    else {
      this.FileType.TestProd='Prod';
    }
    this.getConfigXMV();
  }

  getConfigXMV(){
    console.log('getConfigXMV()');
    this.EventHTTPReceived[3]=false;
    //this.Google_Object_Name="ConfigXMVTestProd.json";
   const HTTP_Address=this.Google_Bucket_Access_Root +  "config-xmvit/o/ConfigXMVTestProd.json?alt=media" ;    
            this.http.get<XMVTestProd>(HTTP_Address )
              .subscribe((data ) => {
                this.EventHTTPReceived[3]=true;
                console.log('getConfigXMV() - data received'+ ' [event]' + 3 + ' '+this.EventHTTPReceived[3]);
                this.ConfigTestProd=data;
                
                if (this.FileType.TestProd==='Test'){
                    this.getConfig(this.ConfigTestProd.TestFile,3);
                } else {
                  this.getConfig(this.ConfigTestProd.ProdFile,3);
                }
              },
                error_handler => {
                  console.log('getConfigXMV() - error handler');
                  this.text_error='INIT - error message==> ' + error_handler.message + ' error status==> '+ error_handler.statusText+'   name=> '+ error_handler.name + '   Error url==>  '+ error_handler.url;
                } 
          )
    }


GetUpdatedTable(event:any){
  this.Table_User_Data=event;
}

onClear(){
  this.myForm.reset({
    userId: '',
    password:''
  });
  this.text_error='';
}

onCrypt(type_crypto:string){
    if (type_crypto==='Encrypt'){
            this.Encrypt=encrypt(this.Decrypt,this.Crypto_Key,this.Crypto_Method);
      } else { // event=Decrypt
            this.Decrypt=decrypt(this.Encrypt,this.Crypto_Key,this.Crypto_Method);
          } 
  }




}