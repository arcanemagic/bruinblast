import {defs, tiny} from './examples/common.js';
import {Uniform_Shader} from './project.js';
import { Shape_From_File } from './examples/obj-file-demo.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

const {Phong_Shader, Cube} = defs
export class Game_Object{
    constructor(){
       

        //things you can access in this object: 
        //this.spawn_time : time at which object was spawned 
        //this.projectile_transform: object's transformation matrix 
        //this.vx : object's horizontal velocity 
        //this.vy : object's vertical velocity 
        //this.active : should the object be rendered or not 

        this.model_transform = Mat4.identity();
        this.spawn_locations = [[-6,1.2,0], [-5,-4,0], [-3,-4,0], [1, -4, 0], [1, -4, 0], [3,-4,0], [5,-4,0], [6,1.2,0]];
        this.spawn_velocities =  [[4,0], [3.2,8], [2.7,8.5], [2,8.5], [-2,8.5], [-2.7,8.5],[-3.2,8], [-4,0]];
        this.gravity = 3.9;
        this.types = ["bruin", "trojan", "bomb"]

        this.active = 1
        this.slashed = false;
        
        this.shapes = {
            cube: new Cube(),
            bruin: new Shape_From_File("assets/bruin.obj"),
            trojan: new Shape_From_File("assets/trojan.obj"),
            bomb: new Shape_From_File("assets/bomb.obj"),
            bruin1: new Shape_From_File("assets/bear-half-2.obj"),
            bruin2: new Shape_From_File("assets/bear-half.obj"),
            trojan1: new Shape_From_File("assets/trojan-half-2.obj"),
            trojan2: new Shape_From_File("assets/trojan-half-2.obj"),

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

    setup(time){
        this.spawn_time = time
        let num = Math.floor(Math.random() * 8);
        this.type = this.types[Math.floor(Math.random() * 3)] //which literal object we're going to draw 
        this.spawn_location = this.spawn_locations[num];
        this.spawn_velocity = this.spawn_velocities[num];
        this.vx = this.spawn_velocity[0];
        this.vy = this.spawn_velocity[1];
        if (this.vy == 0)
            this.gravity = 1.05;
        else
            this.gravity = 3.9;
        
        if (this.type == "bruin"){
            this.scale = .75 
        }
        else if (this.type == "trojan"){
            this.scale = 1
        }
        else {
            this.scale = .75
        }

    }

    
    update_state(time, scene = 0){
        let t2 = time - this.spawn_time 

        this.projectile_transform = this.model_transform.times(Mat4.translation(this.spawn_location[0], this.spawn_location[1], this.spawn_location[2]))
                                                        .times(Mat4.translation(this.vx*t2, this.vy*t2-this.gravity*t2**2, 0))
        /*.times(Mat4.translation(this.vx*t2, this.vy*t2-3.9*t2**2, 0))*/

                                            
        //add control for if trojan goes off screen without being slashed    
        
        if (this.active && t2 > 3){
            this.active = 0

            //TODO: SOPHIA
            if (this.type == "trojan"){
                console.log("trojan fell off screen")
                this.decrement_lives(scene)
            }
        }
    }

    decrement_lives(scene){
        scene.lives-- 
        if (scene.lives <= 0){
            scene.status = 2
        }
                                                      
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
            this.shapes.cube.draw(context, program_state, this.projectile_transform.times(Mat4.scale(0.9,0.9,0.9)),
                this.materials.picking.override({color:this.picking_color})); 
        }
        else if (this.type == "trojan"){
            this.shapes.cube.draw(context, program_state, this.projectile_transform.times(Mat4.scale(0.8,1.2,1)),
            this.materials.picking.override({color:this.picking_color})); 
        }
        else {
            this.shapes.bomb.draw(context, program_state, this.projectile_transform.times(Mat4.scale(this.scale, this.scale, this.scale)),
            this.materials.picking.override({color:this.picking_color})); 
        }
    }

    
    draw_actual(context, program_state){

        if (this.type == "bruin"){
            if (!this.slashed){
                this.shapes.bruin.draw(context, program_state, this.projectile_transform.times(Mat4.scale(this.scale,this.scale,this.scale)),
                this.materials.bruin_texture); 
                this.projectile_transform1 = this.projectile_transform;
                this.projectile_transform2 = this.projectile_transform;
            }
            else {
                let t2 = program_state.animation_time - this.spawn_time
                this.projectile_transform1 = this.projectile_transform1.times(Mat4.translation(0.2,-0.1, 0))
                this.projectile_transform2 = this.projectile_transform2.times(Mat4.translation(-0.2,0.1, 0))
                this.shapes.bruin1.draw(context, program_state, this.projectile_transform1.times(Mat4.scale(this.scale,this.scale,this.scale)),
                this.materials.bruin_texture); 
                this.shapes.bruin2.draw(context, program_state, this.projectile_transform2.times(Mat4.scale(this.scale,this.scale,this.scale)),
                this.materials.bruin_texture); 
            }

        }
        else if (this.type == "trojan"){
            if (!this.slashed){
                this.shapes.trojan.draw(context, program_state, this.projectile_transform.times(Mat4.scale(this.scale,this.scale,this.scale)),
                this.materials.trojan_texture); 
                this.projectile_transform1 = this.projectile_transform;
                this.projectile_transform2 = this.projectile_transform;
            }
            else {
                let t2 = program_state.animation_time - this.spawn_time
                this.projectile_transform1 = this.projectile_transform1.times(Mat4.translation(0.5,-0.1, 0))
                this.projectile_transform2 = this.projectile_transform2.times(Mat4.translation(-0.5,0.1, 0))
                this.shapes.trojan1.draw(context, program_state, this.projectile_transform1.times(Mat4.scale(this.scale,this.scale,this.scale)),
                this.materials.trojan_texture); 
                this.shapes.trojan2.draw(context, program_state, this.projectile_transform2.times(Mat4.scale(this.scale,this.scale,this.scale)),
                this.materials.trojan_texture); 
            }
        }
        else {
            this.shapes.bomb.draw(context, program_state, this.projectile_transform.times(Mat4.scale(this.scale,this.scale,this.scale)),
            this.materials.bomb_texture); 
        }
    }
    interact(scene){ 
        this.active = 0
        if (this.type == "bruin"){
            this.decrement_lives(scene)
            this.slashed = true
            console.log("BRUIN slashed")
        }
        else if (this.type == "trojan"){
            scene.score++ 
            this.slashed = true
            console.log("TROJAN slashed")
        }
        else {
            console.log("BOMB slashed")
            scene.status = 2 
        }
    }
    // affect_lives(lives){
    //     return lives - this.life_effect
    // }
    // affect_points(points){
    //     return points + this.point_effect 
    // }

}