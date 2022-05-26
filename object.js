import {defs, tiny} from './examples/common.js';
import {Uniform_Shader} from './project.js';
import { Shape_From_File } from './examples/obj-file-demo.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

const {Phong_Shader} = defs
export class Game_Object{
    constructor(spawn_time){
        this.spawn_time = spawn_time
        this.model_transform = Mat4.identity();
        let spawn_locations = [[-3,-4,0], [-2,-4,0], [0, -4, 0], [0, -4, 0], [2,-4,0], [3,-4,0]];
        let spawn_velocities =  [[1.5,8], [2.5,8],[-1.5,8], [-2.5,8]];
        
        let types = ["bruin", "trojan", "bomb"]

    
        
        this.spawn_location = spawn_locations[Math.floor(Math.random() * 6)];
        this.spawn_velocity = spawn_velocities[Math.floor(Math.random() * 3)]
        this.vx = this.spawn_velocity[0]
        this.vy = this.spawn_velocity[1]

        this.type = types[Math.floor(Math.random() * 3)] //which literal object we're going to draw 
        
        if (this.type == "bruin"){
            this.scale = .75 
        }
        else if (this.type == "trojan"){
            this.scale = 1
        }
        else {
            this.scale = .75
        }
        this.shapes = {
            bruin: new Shape_From_File("assets/bruin.obj"),
            trojan: new Shape_From_File("assets/trojan.obj"),
            bomb: new Shape_From_File("assets/bomb.obj")
        }
        this.materials = {
            bruin_texture: new Material(new Phong_Shader(), {
                color: color(0, 0, 1, 1), 
                ambient: 0.5, diffusivity: 0.5, specularity: 0.5
            }),
            trojan_texture: new Material(new Phong_Shader(), {
                color: color(1, 0, 0, 1), 
                ambient: 0.5, diffusivity: 0.5, specularity: 0.5
            }), 
            bomb_texture: new Material(new Phong_Shader(), {
                color: color(0, 0, 0, 1), 
                ambient: 0.5, diffusivity: 0.5, specularity: 0.5
            }), 
            picking: new Material(new Uniform_Shader(), {
                color: color(0,0,0,1)
            })
        }

    }

    update_state(time, scene = 0){
        let t2 = time - this.spawn_time 

        this.projectile_transform = this.model_transform.times(Mat4.translation(this.spawn_location[0], this.spawn_location[1], this.spawn_location[2]))
                                                        .times(Mat4.translation(this.vx*t2, this.vy*t2-3.9*t2**2, 0)).times(Mat4.scale(this.scale,this.scale,this.scale))
        //add control for if trojan goes off screen without being slashed            
    }

    est_picking_color(color){
        this.picking_color = color 
    }
    est_id(id){
        this.id = id
    }

    draw_picking(context, program_state){
        if (this.type == "bruin"){
            this.shapes.bruin.draw(context, program_state, this.projectile_transform,
                this.materials.picking.override({color:this.picking_color})); 
        }
        else if (this.type == "trojan"){
            this.shapes.trojan.draw(context, program_state, this.projectile_transform,
            this.materials.picking.override({color:this.picking_color})); 
        }
        else {
            this.shapes.bomb.draw(context, program_state, this.projectile_transform,
            this.materials.picking.override({color:this.picking_color})); 
        }
    }

    fake_draw(context, program_state){
        //console.log("fake draw")
        this.shapes.bruin.draw(context, program_state, this.model_transform.times(Mat4.translation(-2, 0, 0)), this.materials.bruin_texture)
    }
    draw_actual(context, program_state){
        if (this.type == "bruin"){
            this.shapes.bruin.draw(context, program_state, this.projectile_transform,
            this.materials.bruin_texture); 
        }
        else if (this.type == "trojan"){
            this.shapes.trojan.draw(context, program_state, this.projectile_transform,
            this.materials.trojan_texture); 
        }
        else {
            this.shapes.bomb.draw(context, program_state, this.projectile_transform,
            this.materials.bomb_texture); 
        }
    }
    interact(){ 
        if (this.type == "bruin"){
            console.log("BRUIN slashed")
        }
        else if (this.type == "trojan"){
            console.log("TROJAN slashed")
        }
        else {
            console.log("BOMB slashed")
        }
    }
    // affect_lives(lives){
    //     return lives - this.life_effect
    // }
    // affect_points(points){
    //     return points + this.point_effect 
    // }

}