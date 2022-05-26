import {defs, tiny} from './examples/common.js';
import { Shape_From_File } from './examples/obj-file-demo.js';
import { Text_Line } from './examples/text-demo.js';
import { Game_Object} from './object.js'


const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Textured_Phong, Subdivision_Sphere, Phong_Shader} = defs

export class Class_Project extends Scene {
    constructor() {
        super();
        this.shapes = {
            cube: new Cube(),
            sphere: new Subdivision_Sphere(4), 
            teapot: new Shape_From_File("assets/teapot.obj"),
            text: new Text_Line(35),
            bruin: new Shape_From_File("assets/bruin.obj"),
            trojan: new Shape_From_File("assets/trojan.obj")
        }

       


        this.materials = {
            sky_texture: new Material(new Texture_Scroll_X(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/sky.png", "LINEAR_MIPMAP_LINEAR")
            }),

            bruin_texture: new Material(new Phong_Shader(), {
                color: color(0, 1, 1, 1), 
                ambient: 0.5, diffusivity: 0.5, specularity: 0.5
            }),
            text_background: new Material(new Phong_Shader(), {
                color: hex_color("000000"), 
                ambient: 1, diffusivity: 0, specularity: 0,
            }),
            text_image: new Material(new defs.Textured_Phong(1), {
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture("assets/text.png")
            }), 

            
            
        }

        this.start_mouseX = -1;
        this.start_mouseY = -1;
        this.end_mouseX = -1; 
        this.end_mouseY = -1; 
        this.mouseX = -1 
        this.mouseY = -1 
        this.initialized = false;
        this.lives = 3 

        this.objs = [];
        this.score = 0; 

        // initial velocities
        

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));

        this.objects_deposit = []
        for (let i = 0; i < 50; i++){
            this.objects_deposit.push(new Game_Object())
        }
        this.objects_deposit_index = 0 //increment this every time you spawn a new object in display() 

       
     
        //this.objs.push(new Game_Object(0))
    }

    make_control_panel() {
        
        this.key_triggered_button("shoot", ["c"], () => {
            this.rotate ^= 1; 
        });
       
    }
    
    make_picking_color(object_id){
        //from https://webglfundamentals.org/webgl/lessons/webgl-picking.html
        let red = ((object_id >> 16) & 0xFF) / 255; //3rd byte from right  
		let green = ((object_id >> 8) & 0xFF) / 255; 
		let blue = ((object_id >> 0) & 0xFF) / 255; //least significant byte 
		let picking_color = color(red,green,blue,1);
        return picking_color
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -8));
        }

        
        this.view_matrix = program_state.camera_inverse; 
        this.projection_matrix = program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();
        
        const gl = context.context 


        //add listener for mouse clicks 
        if (!this.initialized){
            const rect = context.canvas.getBoundingClientRect() 
            this.rect_left = rect.left 
            this.rect_top = rect.top 
           
            gl.canvas.addEventListener("mouseup", (e) => {
              
                this.end_mouseX = e.clientX - this.rect_left; 
                this.end_mouseY = e.clientY - this.rect_top; 

                this.width = rect.right - rect.left; 
                this.height = rect.bottom - rect.top; 
                
                
               

            })
            gl.canvas.addEventListener("mousedown", (e) => {
                
                console.log("mouse clicked")
                this.start_mouseX = e.clientX - this.rect_left; 
                this.start_mouseY = e.clientY - this.rect_top; 


            })

           
            this.initialized = true; 
        }
        
        

    //update transformation matrices of each active object 

        let index = Math.floor((t)/5);

        


            //spawn new object 
            //TODO : SOPHIA / SIYU : need to find another way to keep track of elapsed time without checking objects length 
        if (this.objs.length <= index && Math.floor(t)%5 == 0){
            this.objs.push(this.objects_deposit[this.objects_deposit_index]);  
            (this.objs[this.objects_deposit_index]).set_spawn_time(t)
            this.objects_deposit_index++ 
            console.log(this.objects_deposit_index)          
        }


        let object_id = 20 
        for (let i = 0; i < this.objs.length; i++, object_id++){
            this.objs[i].update_state(t)
            this.objs[i].est_id(object_id)
            this.objs[i].est_picking_color(this.make_picking_color(object_id)) 
        }
        for (let i = 0; i < this.objs.length; i++){
            this.objs[i].draw_picking(context, program_state)
        }
        
        /////// IGNORE THIS: Mouse picking implementation 
        if (this.start_mouseX >= 0 && this.start_mouseY >= 0 && this.end_mouseX >= 0 && this.end_mouseY >= 0){
            this.mouseX = (this.start_mouseX + this.end_mouseX) / 2
            this.mouseY = (this.start_mouseY + this.end_mouseY) / 2
        }

            const pixelX = this.mouseX * gl.canvas.width / gl.canvas.clientWidth;
            const pixelY = gl.canvas.height - this.mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
            const data = new Uint8Array(4);
            gl.readPixels(pixelX,pixelY,1,1,gl.RGBA,gl.UNSIGNED_BYTE,data);
            this.mouseX = -1;
            this.mouseY = -1;

            if (this.start_mouseX >= 0 && this.start_mouseY >= 0 && this.end_mouseX >= 0 && this.end_mouseY >= 0){
                this.start_mouseX = -1 
                this.start_mouseY = -1 
                this.end_mouseX = -1 
                this.end_mouseY = -1 
            }
            

            // convert RGB of pixel to id value (to compare to object id)
            let selected_model_id = data[0]*256*256 + data[1]*256 + data[2];
            
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


            //what to do if the object gets clicked-- see interact() function in object.js
            for (let i = 0; i < this.objs.length; i++){
                if (selected_model_id == this.objs[i].id){
                    this.objs[i].interact()
                    selected_model_id = -1 
                    break
                }
            }
            
            //////// END OF MOUSE PICKING IMPLEMENTATION 



            for (let i = 0; i < this.objs.length; i++){
                this.objs[i].draw_actual(context, program_state)
            }


        
            



            //draw sky 
            let sky_model_transform = model_transform.times(Mat4.translation(0,0,-30)).times(Mat4.scale(100,100,0.1))
            this.shapes.cube.draw(context, program_state, sky_model_transform, this.materials.sky_texture)
            /////////


            //draw text 
            let text_background_transform = model_transform.times(Mat4.translation(-6,3.9,-3)).times(Mat4.scale(2.3,0.6,0))
            this.shapes.cube.draw(context, program_state, text_background_transform, this.materials.text_background)
            let text_transform = model_transform.times(Mat4.translation(-5.4,2.8,0)).times(Mat4.scale(0.2, 0.2, 0.2))
            this.shapes.text.set_string("Score: " + this.score, context.context);
            this.shapes.text.draw(context, program_state, text_transform, this.materials.text_image)

    

       
    
}
}


class Texture_Scroll_X extends Textured_Phong {
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
               
                float x = f_tex_coord.x; 
                float y = f_tex_coord.y; 
                float x_coord = x - mod(0.1 * animation_time, 10.0); 
                
                vec2 scrolled_tex_coord = vec2(x_coord, y); 
                vec4 tex_color = texture2D( texture, scrolled_tex_coord);
                if( tex_color.w < .01 ) discard;
               
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}




export class Uniform_Shader extends Shader {
    //This shader gives the object one color, determined by "color" passed in 

    constructor() {
        super();
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
            precision mediump float;
            uniform vec4 shape_color;
            uniform vec3 squared_scale, camera_center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
            void main(){                                                                   
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
              } `;
    }

    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            void main(){                                                           
                gl_FragColor = vec4( shape_color.xyz, shape_color.w );
            } `;
    }

    send_material(gl, gpu, material) {
        gl.uniform4fv(gpu.shape_color, material.color);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

       
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        const defaults = {color: color(0, 0, 0, 1)};
        material = Object.assign({}, defaults, material);
        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}