import { socket_library } from "./linux_agent.js";
import { S2nTLS } from "../ssl_lib/s2ntls.js";

export class S2nTLS_Linux extends S2nTLS{

    constructor(public moduleName: string, public socket_library: String, is_base_hook: boolean){
        super(moduleName, socket_library);
    }

    execute_hooks(){
        this.install_plaintext_read_hook();
        this.install_plaintext_write_hook();
        this.install_tls_keys_callback_hook();
    }

    //if set_config is called, the keylog callback is set
    install_tls_keys_callback_hook(){
        
        S2nTLS.s2n_set_key_log_cb = new NativeFunction(this.addresses[this.module_name]["s2n_config_set_key_log_cb"], "int", ["pointer", "pointer", "pointer"]);
        
        Interceptor.attach(this.addresses[this.module_name]["s2n_connection_set_config"], 
            {
            onEnter: function(args: any){
            
                let emptyPointer = ptr("0");
                S2nTLS.s2n_set_key_log_cb(args[1], S2nTLS.keylog_callback, emptyPointer);                    
            }
        })
        
    }
}

export function s2ntls_execute(moduleName: string, is_base_hook: boolean){
    var s2n_tls = new S2nTLS_Linux(moduleName, socket_library, is_base_hook);
    s2n_tls.execute_hooks();

    if (is_base_hook){
        const init_addresses = s2n_tls.addresses[moduleName];
        // ensure that we only add it to global when we are not
        if (Object.keys(init_addresses).length > 0){
            (global as any).init_addresses[moduleName] = init_addresses;
        }
    }
}