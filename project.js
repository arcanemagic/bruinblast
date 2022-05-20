import {defs, tiny} from './examples/common.js';
import { Shape_From_File } from './examples/obj-file-demo.js';
import { Text_Line } from './examples/text-demo.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Textured_Phong, Subdivision_Sphere, Phong_Shader} = defs

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
            text: new Text_Line(35)
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

            text_background: new Material(new Phong_Shader(), {
                color: hex_color("000000"), 
                ambient: 1, diffusivity: 0, specularity: 0,
                //texture: new Texture("assets/trojan.jpeg", "NEAREST")
            }),
            text_image: new Material(new defs.Textured_Phong(1), {
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture("assets/text.png")
            })
        }

        this.mouseX = -1;
        this.mouseY = -1;
        this.initialized = false;
        
        this.mouse_ray = undefined; 
        this.objs = [];
        this.score = 0; 

        // initial velocities
        this.vels = [[5,15.5], [7,15],[-5,15.5], [-7,15]];
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
    
    handle_click(){
        console.log(this.mouseX)
        console.log(this.mouseY)

        let normalized_coords = this.normalize_coordinates()
        let clipped_coords = this.clip_coordinates(normalized_coords)
        let eye_coords = this.convert_to_eye_coordinates(clipped_coords)
       
        this.mouse_ray = this.convert_to_eye_coordinates(eye_coords)
        console.log(this.mouse_ray)
    }

    normalize_coordinates(){
        let x = (2.0 * this.mouseX) / this.width - 1.0 
        let y = 1.0 - (2.0 * this.mouseY) / this.height 
        let z = 1.0 
        return vec3(x, y, z)
    }


    clip_coordinates(normalized_coords){
        return vec4(normalized_coords[0], normalized_coords[1], -1.0, 1.0)
    }

    convert_to_eye_coordinates(clipped_coords){
        let inverted_projection_matrix = Mat4.inverse(this.projection_matrix)

        let eye_coords = inverted_projection_matrix.times(clipped_coords)
        return vec4(eye_coords[0], eye_coords[1], -1.0, 0.0)
    }
     
    convert_to_world_coordinates(eye_coords){
        let inverted_camera_matrix = Mat4.inverse(this.view_matrix)
        let ray_world = inverted_camera_matrix.times(eye_coords)
        ray_world = vec3(ray_world[0], ray_world[1], ray_world[2])

        return ray_world.normalize(); 

        
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
            gl.canvas.addEventListener("click", (e) => {
                console.log("click")
                const rect = context.canvas.getBoundingClientRect(); 
                this.mouseX = e.clientX - rect.left; 
                this.mouseY = e.clientY - rect.top; 

                this.width = rect.right - rect.left; 
                this.height = rect.bottom - rect.top; 
                this.handle_click()

            })
            this.initialized = true; 
        }
        
        //draw sky 
        let sky_model_transform = model_transform.times(Mat4.translation(0,0,-30)).times(Mat4.scale(100,100,0.1))
        this.shapes.cube.draw(context, program_state, sky_model_transform, this.materials.sky_texture)
        /////////


        //draw text 
        let text_background_transform = model_transform.times(Mat4.translation(-6,3.9,-3)).times(Mat4.scale(2,0.5,0))
        this.shapes.cube.draw(context, program_state, text_background_transform, this.materials.text_background)
        let text_transform = model_transform.times(Mat4.translation(-5.4,2.8,0)).times(Mat4.scale(0.2, 0.2, 0.2))
        this.shapes.text.set_string("Score: " + this.score, context.context);
        this.shapes.text.draw(context, program_state, text_transform, this.materials.text_image)

        // this.shapes.box_1.draw(context, program_state, cube_1_transform, this.materials.texture1); 
        let spawns = [[-4,-4,0], [-5.5,-4,0], [5.5,-4,0], [4,-4,0]];

        let index = Math.floor(t/5);

        if (this.objs.length <= index && Math.floor(t)%5 == 0){
            this.objs.push(t);
            this.type = Math.floor(Math.random() * 4);
            this.spawn = spawns[this.type];
            this.vx = this.vels[this.type][0];
            this.vy = this.vels[this.type][1];
            this.texture = this.materials.texture1;
            if (this.type%2 ==0)
                this.texture = this.materials.texture2;
        }

        
        let t2 = t - this.objs[index];
        this.shapes.sphere.draw(context, program_state, model_transform.times(Mat4.translation(this.spawn[0],this.spawn[1], this.spawn[2]))
                                                                       .times(Mat4.scale(0.5,0.5,0.5))
                                                                       .times(Mat4.translation(this.vx*t2,this.vy*t2-4.9*t2**2,0)),
                                this.texture); 
}
}


class Texture_Scroll_X extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
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
                                                                         // Compute an initial (ambient) color:

               // is it inside black portion? 
                // x = mod(x_coord, 1.0); 
                // y = mod(y, 1.0); 
                // if (x >= .15 && x <= .85 && y >= .15 && y <= .85 && !(x >= .25 && x <= .75 && y >= .25 && y <= .75)){
                //     tex_color.xyz *= 0.0; 
                // }
               
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}


class Texture_Rotate extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #7.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            void main(){
                // Sample the texture image in the correct place:
                float PI = 3.14159265; 
                float angle = -mod(0.5 * PI * animation_time, 20.0 * PI); 
                mat2 rotation_transform_matrix = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
                vec2 rotated_tex_coord = rotation_transform_matrix * (f_tex_coord.xy - 0.5) + 0.5; 
                vec4 tex_color = texture2D( texture, rotated_tex_coord );

               
                if( tex_color.w < .01 ) discard;

                float x = rotated_tex_coord.x; 
                float y = rotated_tex_coord.y;

                if (x >= .15 && x <= .85 && y >= .15 && y <= .85 && !(x >= .25 && x <= .75 && y >= .25 && y <= .75)){
                    tex_color.xyz *= 0.0; 
                }
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}

