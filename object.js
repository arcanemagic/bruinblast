import {defs, tiny} from './examples/common.js';
import {Uniform_Shader} from './project.js';
import { Shape_From_File } from './examples/obj-file-demo.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

const {Phong_Shader, Cube} = defs
export class Game_Object{
   
        
        
        constructor(shapes, materials){
       
            this.shapes = shapes 
            this.materials = materials
            //things you can access in this object: 
            //this.spawn_time : time at which object was spawned 
            //this.projectile_transform: object's transformation matrix 
            //this.vx : object's horizontal velocity 
            //this.vy : object's vertical velocity 
            //this.active : should the object be rendered or not 
    
            this.model_transform = Mat4.identity();
      
                                //arranged as spawn location, spawn velocity 
            this.spawn_pairs = [[[-6,1.2,0], [3.5, 0]], //spawn on left up side 1
                                [[-6,1.2,0], [ 5, 0]],   //2
                                [[-6,1.2,0], [ 4, 0]],  //3
                                [[6,1.2,0], [-3.5, 0]], //spawn on right up side 4
                                [[6, 1.2, 0], [ -5, 0]],//5
                                [[6, 1.2, 0], [-4, 0]],//6
                                [[-5, -4, 0], [3.2, 8]], //7
                                [[-5, -4, 0], [2.7, 8.5]],//8
                                [[-3, -4, 0], [2, 8.5]],//9
                                [[-5, -4, 0], [2, 8.5]],//10
                                [[-3, -4, 0], [2.7, 8.5]],//11
                                [[-3, -4, 0], [2.3, 8]],//12
                                [[1, -4, 0], [0, 7]],//13
                                [[1, -4, 0], [-1, 8]], //14
                                [[0, -4, 0], [0, 7]],//15
                                [[3, -4, 0], [-2, 8.5]],//16
                                [[3, -4, 0], [-2.7, 8]],//17
                                [[3, -4, 0], [-2.4, 8]],//18
                                [[5, -4, 0], [-2, 8.5]],//19
                                [[5, -4, 0], [-2.8, 8]],//20
                                [[5, -4, 0], [-3, 8.5]],//21
                                [[5, -4, 0], [-3, 8.2]],//22
                               ]
            this.gravity = 3.9;
            this.types = ["bruin", "bruin", "bruin", "trojan", "trojan", "trojan", "trojan", "bomb"]
    
            this.active = 0
            this.slashed = false;
            
            
    
        }
    
        setup(time){
            this.spawn_time = time
            this.active = 1
            this.slashed = false 
            let num = Math.floor(Math.random() * 22);
            this.type = this.types[Math.floor(Math.random() * 8)] //which literal object we're going to draw 
            this.spawn_location = this.spawn_pairs[num][0];
            this.spawn_velocity = this.spawn_pairs[num][1];

           
            this.vx = this.spawn_velocity[0];
            this.vy = this.spawn_velocity[1];
            if (this.vy == 0)
                this.gravity = 2.1;
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
            
            this.projectile_transform = this.model_transform.times(Mat4.translation(this.spawn_location[0], this.spawn_location[1], 0))
                                                            .times(Mat4.translation(this.vx*t2, this.vy*t2-this.gravity*t2**2, 0))
    
                                                
            //add control for if trojan goes off screen without being slashed    
            let point = (this.projectile_transform.times(vec4(0,0,0,1)))
            let x = point[0]
            let y = point[1]
            if (this.active == 2 && time - this.slash_time >= 1){
                this.active = 0; 
            }
            if (this.active == 1 && (y < -4 || x < -6 || x > 6)){
                this.active = 0
    
                console.log(`${this.type} fell off screen`)
             

                // UNCOMMENT: SOPHIA
                if (this.type == "trojan"){
                    this.decrement_lives(scene)
                }
            }
        }
    
        decrement_lives(scene){
            scene.lives-- 
            if (scene.lives <= 0){
                scene.status = 2
            }                                          
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
                //ignore slashing
                if (!this.slashed){
                    this.shapes.bruin.draw(context, program_state, this.projectile_transform.times(Mat4.scale(this.scale,this.scale,this.scale)),
                    this.materials.bruin_texture); 
                    this.projectile_transform1 = this.projectile_transform;
                    this.projectile_transform2 = this.projectile_transform;
                }
                else {
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
        interact(scene, time){ 
            this.active = 2
            this.slashed = true 
            this.slash_time = time 
            if (this.type == "bruin"){
                this.decrement_lives(scene) 
                console.log("BRUIN slashed")
            }
            else if (this.type == "trojan"){
                scene.score++ 
                console.log("TROJAN slashed")
            }
            else {
                console.log("BOMB slashed")
                scene.status = 2 
            }
        }

    }