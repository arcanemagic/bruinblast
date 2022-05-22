import {defs, tiny} from './examples/common.js';
import { Shape_From_File } from './examples/obj-file-demo.js';
import { Text_Line } from './examples/text-demo.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Textured_Phong, Subdivision_Sphere, Phong_Shader, Basic_Shader} = defs

export class Class_Project extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        
        // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
        //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
        //        a cube instance's texture_coords after it is already created.
        this.shapes = {
            cube: new Cube(),
            sphere: new Subdivision_Sphere(4), 
            teapot: new Shape_From_File("assets/teapot.obj"),
            text: new Text_Line(35),
            bruin: new Shape_From_File("assets/bruin.obj"),
            trojan: new Shape_From_File("assets/trojan.obj")
        }
        // this.box_1_angle = 0
        // this.box_2_angle = 0
        // this.rotate = 1

        //console.log(this.shapes.cube.arrays.texture_coord)

        for (let i = 0; i < 24; i++){
            this.shapes.cube.arrays.texture_coord[i] = this.shapes.cube.arrays.texture_coord[i].times(4)
        }
        for (let i = 0; i < 1091; i++){
            this.shapes.sphere.arrays.texture_coord[i] = this.shapes.sphere.arrays.texture_coord[i].times(2); 
        }


        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
            }),
            texture1: new Material(new Textured_Phong(), {
                color: color(1,0,0,1),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/trojan.jpeg", "NEAREST")
            }),
            texture2: new Material(new Textured_Phong(), {
                color: color(1,0,0,1),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
            }),
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
                //texture: new Texture("assets/trojan.jpeg", "NEAREST")
                // comment
            }),
            text_image: new Material(new defs.Textured_Phong(1), {
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture("assets/text.png")
            }), 

            picking: new Material(new Uniform_Shader(), {
                color: color(0,1,0,1)
            })
            
        }

        this.start_mouseX = -1;
        this.start_mouseY = -1;
        this.end_mouseX = -1; 
        this.end_mouseY = -1; 
        this.mouseX = -1 
        this.mouseY = -1 
        this.initialized = false;
        
        this.mouse_ray = undefined; 
        this.objs = [];
        this.score = 0; 

        // initial velocities
        this.vels = [[3,15.5], [5,15],[-3,15.5], [-5,15]];
        this.type, this.vx, this.vy = 0;
        this.texture = null;
        this.spawn = vec3();

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        
    }

    make_control_panel() {
        
        this.key_triggered_button("shoot", ["c"], () => {
            this.rotate ^= 1; 
        });
       
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
                //console.log("Mouse released")
                //const rect = context.canvas.getBoundingClientRect(); 
                this.end_mouseX = e.clientX - this.rect_left; 
                this.end_mouseY = e.clientY - this.rect_top; 

                this.width = rect.right - rect.left; 
                this.height = rect.bottom - rect.top; 
                //console.log(` end mouseX: ${this.end_mouseX}  end mouseY: ${this.end_mouseY} `)

            })
            gl.canvas.addEventListener("mousedown", (e) => {
                //console.log("Mouse down")
                //const rect = context.canvas.getBoundingClientRect(); 
                this.start_mouseX = e.clientX - this.rect_left; 
                this.start_mouseY = e.clientY - this.rect_top; 

                
                //console.log(` start mouseX: ${this.start_mouseX}  start mouseY: ${this.start_mouseY} `)

            })
            this.initialized = true; 
        }
        
        

        

        
        let object_id = 20

       
        
        //from https://webglfundamentals.org/webgl/lessons/webgl-picking.html
        let red = ((object_id >> 16) & 0xFF) / 255; //3rd byte from right  
		let green = ((object_id >> 8) & 0xFF) / 255; 
		let blue = ((object_id >> 0) & 0xFF) / 255; //least significant byte 
		let picking_color = color(red,green,blue,1);
        this.shapes.bruin.draw(context, program_state, model_transform.times(Mat4.translation(-2,0,0)), this.materials.picking.override({color:picking_color}))

        if (this.start_mouseX >= 0 && this.start_mouseY >= 0 && this.end_mouseX >= 0 && this.end_mouseY >= 0){
            this.mouseX = (this.start_mouseX + this.end_mouseX) / 2
            this.mouseY = (this.start_mouseY + this.end_mouseY) / 2
        }

        //from https://webglfundamentals.org/webgl/lessons/webgl-picking.html
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

        if (selected_model_id == object_id){
            console.log("cube clicked!")
            selected_model_id = -1 
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

        // this.shapes.box_1.draw(context, program_state, cube_1_transform, this.materials.texture1); 
        let spawns = [[-4,-4,0], [-3,-4,0], [2,-4,0], [4,-4,0]];

        let index = Math.floor(t/5);

        if (this.objs.length <= index && Math.floor(t)%5 == 0){
            this.objs.push(t);
            this.score++; 
            this.type = Math.floor(Math.random() * 4);
            this.spawn = spawns[this.type];
            this.vx = this.vels[this.type][0];
            this.vy = this.vels[this.type][1];
            this.texture = this.materials.texture1;
            
        }

        this.shapes.bruin.draw(context, program_state, model_transform.times(Mat4.translation(-2,0,0)), this.materials.bruin_texture)

       /*
        let t2 = t - this.objs[index];
        let projectile_transform = model_transform.times(Mat4.translation(this.spawn[0],this.spawn[1], this.spawn[2]))
        .times(Mat4.scale(0.5,0.5,0.5))
        .times(Mat4.translation(this.vx*t2,this.vy*t2-4.9*t2**2,0)).times(Mat4.rotation(t, 0, 1, 0))
        if (this.type % 2){
        this.shapes.bruin.draw(context, program_state, projectile_transform,
                                this.materials.bruin_texture); 
        }
        else{
            this.shapes.trojan.draw(context, program_state, projectile_transform,
                this.materials.bruin_texture.override({color: color(1,0,0,1)})); 
        }*/

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




class Uniform_Shader extends Shader {
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