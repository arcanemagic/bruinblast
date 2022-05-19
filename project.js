import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs

export class Assignment4 extends Scene {
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
            box_1: new Cube(),
            box_2: new Cube(),
            axis: new Axis_Arrows()
        }
        this.box_1_angle = 0
        this.box_2_angle = 0
        this.rotate = 1

        console.log(this.shapes.box_2.arrays.texture_coord)

        for (let i = 0; i < 24; i++){
            this.shapes.box_2.arrays.texture_coord[i] = this.shapes.box_2.arrays.texture_coord[i].times(2); 
        }


        // TODO:  Create the materials required to texture both cubes with the correct images and settings.
        //        Make each Material from the correct shader.  Phong_Shader will work initially, but when
        //        you get to requirements 6 and 7 you will need different ones.
        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
            }),
            texture1: new Material(new Texture_Rotate(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/stars.png", "NEAREST")
            }),
            texture2: new Material(new Texture_Scroll_X(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/earth.gif", "LINEAR_MIPMAP_LINEAR")
            }),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        // TODO:  Implement requirement #5 using a key_triggered_button that responds to the 'c' key.
        
        this.key_triggered_button("Start / stop rotation", ["c"], () => {
            this.rotate ^= 1; 
        });
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -8));
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();

        // TODO:  Draw the required boxes. Also update their stored matrices.
        
        if (this.rotate){
            this.box_1_angle += 2 * Math.PI / 3 * dt 
            this.box_2_angle += 2 * Math.PI / 2 * dt
        }
        let cube_1_transform = model_transform.times(Mat4.translation(-2,0,0)).times(Mat4.rotation(this.box_1_angle, 1, 0, 0))//.times(Mat4.scale(2,2,2)); 
        let cube_2_transform = model_transform.times(Mat4.translation(2,0,0)).times(Mat4.rotation(this.box_2_angle, 0,1,0))//.times(Mat4.scale(2,2,2)); 

        this.shapes.box_1.draw(context, program_state, cube_1_transform, this.materials.texture1); 

        this.shapes.box_2.draw(context, program_state, cube_2_transform, this.materials.texture2); 
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
                float x_coord = x - mod(2.0 * animation_time, 10.0); 
                
                vec2 scrolled_tex_coord = vec2(x_coord, y); 
                vec4 tex_color = texture2D( texture, scrolled_tex_coord);
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:

               // is it inside black portion? 
                x = mod(x_coord, 1.0); 
                y = mod(y, 1.0); 
                if (x >= .15 && x <= .85 && y >= .15 && y <= .85 && !(x >= .25 && x <= .75 && y >= .25 && y <= .75)){
                    tex_color.xyz *= 0.0; 
                }
               
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

