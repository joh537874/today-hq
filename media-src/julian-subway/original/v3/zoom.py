# smooth punch-in: 1.0 -> Z over [a,b], hold, Z -> 1.0 over [c,d]; centered at (cx,cy)
import sys
a,b,c,d,Z=5.2,9.6,10.5,14.9,1.18
ease=lambda u:f"(0.5-0.5*cos(PI*{u}))"
u1=f"clip((t-{a})/({b}-{a}),0,1)"; u2=f"clip((t-{c})/({d}-{c}),0,1)"
z=f"(1+({Z}-1)*({ease(u1)}-{ease(u2)}))"
print(z)
